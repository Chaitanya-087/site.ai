from fastapi import APIRouter

from ..services.chat import get_chats_by_user_id, create_chat_by_user_id,\
                            get_chat_by_id, delete_chat_by_id, \
                            post_message_by_chat_id, rename_chat_by_id, get_token_by_user_id, save_token_by_user_id
from ..services.gemini import get_ai_response

from ..models.chat import Prompt,RenameRequest, CreateChatRequest, TokenRequest

router = APIRouter(
    prefix="/chats",
    tags=["chats"],
)

@router.get("/users/{user_id}/token", status_code=200)
async def get_token(user_id: str):
    return await get_token_by_user_id(user_id)

@router.post("/users/{user_id}/token", status_code=200)
async def save_token(user_id: str, body: TokenRequest):
    return await save_token_by_user_id(user_id, body.token)

@router.get("/users/{user_id}/all", status_code=200)
async def get_all_chats(user_id: str):
    return await get_chats_by_user_id(user_id)

@router.get("/{chat_id}", status_code=200)
async def get_chat(chat_id: str):
    return await get_chat_by_id(chat_id)

@router.post("/users/{user_id}", status_code=201)
async def create_chat(user_id: str, body:CreateChatRequest):
    return await create_chat_by_user_id(user_id, body.name)

@router.post("/default", status_code=200)
async def default_chat(prompt: Prompt):
    return await get_ai_response(prompt.input)

@router.post("/{chat_id}/messages/{user_id}", status_code=201)
async def send_message(chat_id: str, user_id: str, prompt: Prompt):
    return await post_message_by_chat_id(prompt, chat_id, user_id)

@router.post("/{chat_id}/rename", status_code=200)
async def rename_chat(chat_id: str, body: RenameRequest):
    return await rename_chat_by_id(chat_id, body.name)

@router.delete("/{chat_id}", status_code=200)
async def delete_chat(chat_id: str):
    return await delete_chat_by_id(chat_id)
