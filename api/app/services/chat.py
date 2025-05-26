import logging
from fastapi import HTTPException
from bson import ObjectId
from base64 import b64encode, b64decode

from ..config.mongo import chatsCollection, tokensCollection
from ..schemas.chat import all_chats, basic_chat, detailed_chat
from ..models.chat import Chat, Prompt, Code, MessageType, Message
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
    logger.info("Fetching token for user_id: %s", user_id)
    try:
        record = tokensCollection.find_one({"userId": user_id})
        if not record or "token" not in record:
            logger.info("No token found for user_id: %s", user_id)
            return {"token": ""}
        encrypted_token = b64decode(record["token"])
        decrypted_token = PKCS1_OAEP.new(private_key).decrypt(encrypted_token).decode("utf-8")
        logger.info("Token successfully decrypted for user_id: %s", user_id)
        return {"token": decrypted_token}
    except Exception as e:
        logger.error("Token decryption failed for user %s: %s", user_id, e)
        return {"token": ""}


async def save_token_by_user_id(user_id: str, token: str) -> dict:
    logger.info("Saving token for user_id: %s", user_id)
    try:
        encrypted_token = PKCS1_OAEP.new(public_key).encrypt(token.encode("utf-8"))
        encrypted_token_b64 = b64encode(encrypted_token).decode("utf-8")

        update = {"$set": {"token": encrypted_token_b64}}
        tokensCollection.update_one({"userId": user_id}, update, upsert=True)
        logger.info("Token successfully saved for user_id: %s", user_id)
        return {"message": "Token saved successfully."}
    except Exception as e:
        logger.error("Failed to save token for user %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Token encryption or storage failed")


async def get_chats_by_user_id(user_id: str) -> all_chats:
    logger.info("Retrieving chats for user_id: %s", user_id)
    try:
        chats = chatsCollection.find({"userId": user_id})
        return all_chats(chats)
    except Exception as e:
        logger.error("Failed to retrieve chats for user %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve chats")


async def create_chat_by_user_id(user_id: str, name="New Chat") -> basic_chat:
    logger.info("Creating new chat for user_id: %s", user_id)
    try:
        chat = Chat(userId=user_id, name=name)
        result = chatsCollection.insert_one(chat.model_dump())
        logger.info("Chat created with ID: %s for user_id: %s", result.inserted_id, user_id)
        return basic_chat({"_id": result.inserted_id, **chat.model_dump()})
    except Exception as e:
        logger.error("Failed to create chat for user %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Failed to create chat")


async def rename_chat_by_id(chat_id: str, name: str) -> basic_chat:
    logger.info("Renaming chat %s to '%s'", chat_id, name)
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    try:
        result = chatsCollection.update_one({"_id": ObjectId(chat_id)}, {"$set": {"name": name}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        logger.info("Chat %s renamed successfully", chat_id)
        return {"message": "Chat renamed successfully."}
    except Exception as e:
        logger.error("Failed to rename chat %s: %s", chat_id, e)
        raise HTTPException(status_code=500, detail="Failed to rename chat")


async def get_chat_by_id(chat_id: str) -> detailed_chat:
    logger.info("Fetching chat by ID: %s", chat_id)
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    try:
        chat = chatsCollection.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        logger.info("Chat %s retrieved successfully", chat_id)
        return detailed_chat(chat)
    except Exception as e:
        logger.error("Failed to get chat %s: %s", chat_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve chat")


async def delete_chat_by_id(chat_id: str) -> dict:
    logger.info("Deleting chat by ID: %s", chat_id)
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    try:
        result = chatsCollection.delete_one({"_id": ObjectId(chat_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        logger.info("Chat %s deleted successfully", chat_id)
        return {"message": "Chat deleted successfully."}
    except Exception as e:
        logger.error("Failed to delete chat %s: %s", chat_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete chat")


async def post_message_by_chat_id(prompt: Prompt, chat_id: str, user_id: str) -> dict:
    logger.info("Posting message to chat_id: %s by user_id: %s", chat_id, user_id)
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    try:
        record = tokensCollection.find_one({"userId": user_id})
        if not record or "token" not in record:
            raise HTTPException(status_code=401, detail="Unauthorized: No token found")

        decrypted_token = PKCS1_OAEP.new(private_key).decrypt(
            b64decode(record["token"])
        ).decode("utf-8")

        if not decrypted_token:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

        response = await get_ai_response(prompt.input, chat_id, decrypted_token)
        logger.info("AI response generated for chat %s", chat_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI response failed for chat %s: %s", chat_id, e)
        raise HTTPException(status_code=500, detail="AI response generation failed")

    try:
        user_msg = Message(content=prompt.input, type=MessageType.USER)
        ai_msg = Message(content=response['explanation'], type=MessageType.AI)
        code = Code(html=response['html'], css=response['css'], js=response['js'])

        chat = chatsCollection.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        update_data = {
            "$push": {
                "messages": {"$each": [user_msg.model_dump(), ai_msg.model_dump()]}
            },
            "$set": {}
        }

        if code.html.strip(): update_data["$set"]["code.html"] = code.html
        if code.css.strip(): update_data["$set"]["code.css"] = code.css
        if code.js.strip(): update_data["$set"]["code.js"] = code.js
        if chat.get("name") == "New Chat": update_data["$set"]["name"] = prompt.input
        if not update_data["$set"]: del update_data["$set"]

        chatsCollection.update_one({"_id": ObjectId(chat_id)}, update_data)
        logger.info("Message posted and chat updated for chat_id: %s", chat_id)

        return {
            "name": update_data.get("$set", {}).get("name", chat.get("name")),
            "message": ai_msg.model_dump(),
            "code": code.model_dump()
        }

    except Exception as e:
        logger.error("Failed to post message in chat %s: %s", chat_id, e)
        raise HTTPException(status_code=500, detail="Failed to save message in chat")
