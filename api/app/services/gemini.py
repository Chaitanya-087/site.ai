"""This module is used to interact with the Gemini model."""
import json
import os
from dotenv import dotenv_values

from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import JsonOutputParser
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder


from langchain_core.runnables.history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage
import pickle
from redis import Redis
from typing import List


from ..models.chat import Response

DIR = os.path.dirname(os.path.realpath(__file__))
ENV_PATH = os.path.abspath(os.path.join(DIR, '..', '..', '.env.development.local'))

config = dotenv_values(ENV_PATH)

API_KEY = config.get("GEMINI_API_KEY")
REDIS_URL = config.get("REDIS_URL") or 'redis://localhost:8009/0'
REDIS_TOKEN = config.get("REDIS_TOKEN") or None

GENERATION_CONFIG = {
    "temperature": 2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

class UpstashCompatibleChatHistory(BaseChatMessageHistory):
    """
    Upstash-compatible chat message history using simple Redis list operations.

    This avoids unsupported RediSearch commands like FT.INFO, FT.SEARCH, etc.
    """

    def __init__(self, session_id: str, redis_client: Redis):
        self.key = f"chat_history:{session_id}"
        self.redis = redis_client
        self._messages = None  # Lazy loaded

    def add_message(self, message: BaseMessage) -> None:
        """Adds a new message to the Redis list."""
        self.redis.rpush(self.key, pickle.dumps(message))
        if self._messages is not None:
            self._messages.append(message)

    @property
    def messages(self) -> List[BaseMessage]:
        """Returns all stored messages for the session."""
        if self._messages is None:
            self._messages = [
                pickle.loads(item)
                for item in self.redis.lrange(self.key, 0, -1)
            ]
        return self._messages

    def clear(self) -> None:
        """Clears all stored messages for the session."""
        self.redis.delete(self.key)
        self._messages = []

    def __len__(self) -> int:
        return self.redis.llen(self.key)
# session history
def get_redis_history(session_id: str):
    redis_client = Redis(
    host="creative-dodo-16406.upstash.io",
    port=6379,
    password=REDIS_TOKEN,
    ssl=True,
    )
    return UpstashCompatibleChatHistory(session_id, redis_client)

# prompt
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful and friendly web developer. Always respond in valid JSON format:\n"
            "{{\n"
            "  'html': '',\n"
            "  'css': '',\n"
            "  'js': '',\n"
            "  'explanation': ''\n"
            "}}\n\n"
            "strictly follow below rules:\n"
            "- Always use **Tailwind CSS classes** for styling. Avoid raw CSS unless necessary.\n"
            "- Use **GSAP** (GreenSock Animation Platform) for animations in the `js` section.\n"
            "- JS code must be **suitable for embedding in a <script> tag**. Never use `import`, `require`, or module syntax.\n"
            "- If the user gives a casual input (like 'hi', 'thanks', etc.), return the JSON with only the 'explanation'.\n"
            "- If the user asks to update only part of the code (e.g., just JS), keep the rest unchanged.\n"
            "- The explanation should reflect only the current change or response.\n"
            "- keep the explanation concise and relevant to the user's request.\n"
            "- keep other sections (html, css, js) as-is unless explicitly asked to change them.\n"
            "- use shoelace web components whenever needed.\n"
            "- use online images where every it is needed.\n"
        ),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ]
)

# chain
async def get_ai_response(question: str, session_id: str = "default_id", token: str = API_KEY) -> Response:
    """Get a response from the Gemini model."""
    try:
        # Parser
        parser = JsonOutputParser(pydantic_object=Response)
        
        # model
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash",
                                generation_config=GENERATION_CONFIG, api_key=token)
        
        # chain
        chain = prompt | model
        
        runnableWithHistory = RunnableWithMessageHistory(
            chain,
            get_redis_history,
            input_messages_key="input",
            history_messages_key="history",
        )
        
        res = runnableWithHistory.invoke(
            {"input": question},
            config={"configurable": {"session_id": session_id}},
        )
        parsed_response = parser.parse(res.content)
        return parsed_response
    
    except json.JSONDecodeError as e:
        print("Error parsing response as JSON:", res.content)
        raise ValueError("Received invalid JSON format from the model.") from e

    except Exception as e:
        print("An error occurred:", e)
        raise e

# driver code
if __name__ == "__main__":
    import asyncio

    async def main():
        """driver code"""
        response = await get_ai_response("add footer to it", "test_session_id")
        print(response['explanation'])

    asyncio.run(main())
