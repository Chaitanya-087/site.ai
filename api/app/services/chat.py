import logging
from fastapi import HTTPException
from bson import ObjectId
from base64 import b64encode, b64decode

from ..config.mongo import chatsCollection, tokensCollection
from ..schemas.chat import all_chats, basic_chat, detailed_chat
from ..models.chat import Chat, Prompt, Code, MessageType, Message, Token
from .gemini import get_ai_response

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP

logger = logging.getLogger(__name__)

try:
    public_key = RSA.import_key(open('public.pem').read())
    private_key = RSA.import_key(open('private.pem').read())
except Exception as e:
    logger.critical("Failed to load RSA keys: %s", e)
    raise RuntimeError("Encryption keys are missing or corrupted")

async def get_token_by_user_id(user_id: str) -> dict:
    try:
        record = tokensCollection.find_one({"userId": user_id})
        if not record or "token" not in record:
            return {"token": ""}

        encrypted_token = b64decode(record["token"])
        decrypted_token = PKCS1_OAEP.new(private_key).decrypt(encrypted_token).decode("utf-8")
        return {"token": decrypted_token}
    except Exception as e:
        logger.error("Token decryption failed for user %s: %s", user_id, e)
        return {"token": ""}

async def save_token_by_user_id(user_id: str,token: str) -> dict:
    encrypted_token = PKCS1_OAEP.new(public_key).encrypt(token.encode("utf-8"))
    encrypted_token_b64 = b64encode(encrypted_token).decode("utf-8")
    
    existing_token = tokensCollection.find_one({"userId": user_id})
    if existing_token is None:
        token_obj = Token(userId=user_id, token=encrypted_token_b64)
        tokensCollection.insert_one(token_obj.model_dump())
    else:
        tokensCollection.update_one(
            {"userId": user_id},
            {"$set": {"token": encrypted_token_b64}}
        )

    return {"message": "Token saved successfully."}

async def get_chats_by_user_id(user_id: str) -> all_chats:
    resp =  chatsCollection.find({"userId": user_id})
    if resp is None:
        raise HTTPException(status_code=404, detail="No chats found for this user")
    return all_chats(resp)

async def create_chat_by_user_id(user_id: str, name="New Chat") -> basic_chat:
    chat = Chat(userId=user_id, name=name)
    resp = chatsCollection.insert_one(chat.model_dump())
    return basic_chat({"_id": resp.inserted_id, **chat.model_dump()})

async def rename_chat_by_id(chat_id: str, name: str) -> basic_chat:
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    resp = chatsCollection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"name": name}}
    )
    if resp.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat renamed successfully."}    

async def get_chat_by_id(chat_id: str) -> detailed_chat:
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    resp = chatsCollection.find_one({"_id": ObjectId(chat_id)})
    if resp is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return detailed_chat(resp)

async def delete_chat_by_id(chat_id: str) -> dict:
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    resp = chatsCollection.delete_one({"_id": ObjectId(chat_id)})
    if resp.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat deleted successfully."}

async def post_message_by_chat_id(prompt: Prompt, chat_id: str, user_id: str) -> dict:
    record = tokensCollection.find_one({"userId": user_id})
    if not record or "token" not in record:
        raise HTTPException(status_code=401, detail="Unauthorized: No token found")

    encrypted_token_b64 = record["token"]
    encrypted_token = b64decode(encrypted_token_b64)
    
    decrypted_token = PKCS1_OAEP.new(private_key).decrypt(encrypted_token).decode("utf-8")
    
    if not decrypted_token:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    try:
        response = await get_ai_response(prompt.input, chat_id, decrypted_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: AI response failed due to invalid token") from e
    user_message = Message(content=prompt.input, type=MessageType.USER)
    ai_message = Message(content=response['explanation'], type=MessageType.AI)
    code = Code(html=response['html'], css=response['css'], js=response['js'])

    chat = chatsCollection.find_one({"_id": ObjectId(chat_id)})
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    update_data = {
        "$push": {
            "messages": {"$each": [user_message.model_dump(), ai_message.model_dump()]}
        },
        "$set": {}
    }

    if code.html.strip():
        update_data["$set"]["code.html"] = code.html
    if code.css.strip():
        update_data["$set"]["code.css"] = code.css
    if code.js.strip():
        update_data["$set"]["code.js"] = code.js

    if chat.get("name") == "New Chat":
        update_data["$set"]["name"] = prompt.input

    if not update_data["$set"]:
        del update_data["$set"]

    result = chatsCollection.update_one(
        {"_id": ObjectId(chat_id)},
        update_data,
        upsert=True
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {
        "name": update_data.get("$set", {}).get("name", chat.get("name")),
        "message": ai_message.model_dump(),
        "code": code.model_dump()
    }
