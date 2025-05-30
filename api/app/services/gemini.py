import json
import os
from dotenv import load_dotenv

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

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
REDIS_URL = os.getenv("REDIS_URL")
REDIS_TOKEN = os.getenv("REDIS_TOKEN")

GENERATION_CONFIG = {
    "temperature": 2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192
}

class UpstashCompatibleChatHistory(BaseChatMessageHistory):
    def __init__(self, session_id: str, redis_client: Redis):
        self.key = f"chat_history:{session_id}"
        self.redis = redis_client
        self._messages = None

    def add_message(self, message: BaseMessage) -> None:
        """Adds a new message to the Redis list."""
        self.redis.rpush(self.key, pickle.dumps(message))
        if self._messages is not None:
            self._messages.append(message)

    @property
    def messages(self) -> List[BaseMessage]:
        if self._messages is None:
            self._messages = [
                pickle.loads(item)
                for item in self.redis.lrange(self.key, 0, -1)
            ]
        return self._messages

    def clear(self) -> None:
        self.redis.delete(self.key)
        self._messages = []

    def __len__(self) -> int:
        return self.redis.llen(self.key)
    
def get_redis_history(session_id: str):
    redis_client = Redis(
    host="creative-dodo-16406.upstash.io",
    port=6379,
    password=REDIS_TOKEN,
    ssl=True,
    )
    return UpstashCompatibleChatHistory(session_id, redis_client)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful, friendly web developer with modern web knowledge. Always respond in valid JSON format:\n"
            "{{\n"
            "  'html': '',\n"
            "  'css': '',\n"
            "  'js': '',\n"
            "  'explanation': ''\n"
            "}}\n\n"
            "strictly follow below rules:\n"
            "- Always use **Tailwind CSS classes** for styling. Avoid raw CSS unless necessary.\n"
            "- Use **GSAP** (GreenSock Animation Platform) for animations in the `js` section.\n"
            "- The `html` section must be **valid HTML** with better SEO.\n"
            "- Consider you are working on a **single page application**, implement component-based routing using plain html and js only.\n"
            "- Consider that boilerplate code is already present, and you only provide html code inside body tag.\n"
            "- JS code must be **suitable for embedding in a <script> tag**. Never use `import`, `require`, or module syntax.\n"
            "- If the user gives a casual input (like 'hi', 'thanks', etc.), return the JSON with only the 'explanation'.\n"
            "- **Implement all necessary functionality of the site fully and accurately**.\n"
            "- Avoid mockups or placeholders unless explicitly requested.\n"
            "- If the user asks to update only part of the code (e.g., just JS), keep the rest unchanged.\n"
            "- The explanation should reflect only the current change or response.\n"
            "- Keep other sections (html, css, js) as-is unless explicitly asked to change them.\n"
            "- Only update the existing code, never replace the entire code.\n"
            "- Use online images wherever needed.\n"
            "- Use **semantic Tailwind typography classes consistently**: `text-base` for body, `text-lg` to `text-2xl` for headings.\n"
            "- Use **Tailwind spacing scale** like `p-4`, `my-4`, `gap-2`, etc., for consistent layout.\n"
            "- Use **rounded-lg**, **shadow-md**, **bg-gray-100**, **text-gray-800**, and other utility classes for a clean modern design.\n"
            "- Use **responsive classes** where appropriate (e.g., `md:text-lg`).\n"
            "- Follow a neutral, modern theme: use background `bg-gray-50` to `bg-gray-100`, primary text `text-gray-800`, secondary `text-gray-500`.\n"
            "- Assume a custom Tailwind config with: `fontFamily: 'Inter, sans-serif'`, `fontSize: base = 16px`, `lg = 18px`, `xl = 20px`, `2xl = 24px`.\n"

        ),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ]
)

async def get_ai_response(question: str, session_id: str = "default_id", token: str = API_KEY) -> Response:
    """Get a response from the Gemini model."""
    try:
        parser = JsonOutputParser(pydantic_object=Response)
        
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash",
                                generation_config=GENERATION_CONFIG, api_key=token)
        
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
# if __name__ == "__main__":
#     import asyncio

#     async def main():
#         response = await get_ai_response("add footer to it", "test_session_id")
#         print(response['explanation'])

#     asyncio.run(main())
