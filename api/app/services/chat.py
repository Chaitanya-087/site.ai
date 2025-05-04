"""This file contains the services for the chat module"""
from fastapi import HTTPException
from bson import ObjectId

from ..config.mongo import chatsCollection

from ..schemas.chat import all_chats,basic_chat,detailed_chat

from ..models.chat import Chat,Prompt,Code, MessageType, Message

from .gemini import get_ai_response

async def get_chats_by_user_id(user_id: str) -> all_chats:
    """Get all chats by user ID."""
    resp =  chatsCollection.find({"userId": user_id})
    if resp is None:
        raise HTTPException(status_code=404, detail="No chats found for this user")
    return all_chats(resp)

async def create_chat_by_user_id(user_id: str) -> basic_chat:
    """Create a new chat by user ID."""
    chat = Chat(userId=user_id)
    resp = chatsCollection.insert_one(chat.model_dump())
    return basic_chat({"_id": resp.inserted_id, **chat.model_dump()})

async def rename_chat_by_id(chat_id: str, name: str) -> basic_chat:
    """Rename a chat by chat ID."""
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
    """Get a chat by chat ID."""
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    resp = chatsCollection.find_one({"_id": ObjectId(chat_id)})
    if resp is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return detailed_chat(resp)

async def delete_chat_by_id(chat_id: str) -> dict:
    """Delete a chat by chat ID."""
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    resp = chatsCollection.delete_one({"_id": ObjectId(chat_id)})
    if resp.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat deleted successfully."}

async def post_message_by_chat_id(prompt: Prompt, chat_id: str) -> dict:
    """
    Post a message in a chat by chat ID.

    Args:
        prompt (Prompt): The user input and related data.
        chat_id (str): The unique ID of the chat.

    Returns:
        Response: The AI-generated response, including the explanation and any code snippets.
    """
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    response = await get_ai_response(prompt.input, chat_id)
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
        "$set": {"code": code.model_dump()}
    }
    if chat.get("name") == "New Chat":
        update_data["$set"]["name"] = prompt.input

    result = chatsCollection.update_one(
        {"_id": ObjectId(chat_id)},
        update_data,
        upsert=True
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    message = Message(content=response['explanation'], type=MessageType.AI)
    code = Code(html=response['html'], css=response['css'], js=response['js'])
    
    return {
        "message": message.model_dump(),
        "code": code.model_dump()
    }
