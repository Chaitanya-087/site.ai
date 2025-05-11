"""This module is used to interact with the Gemini model."""
import json
import os
from dotenv import dotenv_values

from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import JsonOutputParser

from langchain_redis import RedisChatMessageHistory

from ..models.chat import Response

DIR = os.path.dirname(os.path.realpath(__file__))
ENV_PATH = os.path.abspath(os.path.join(DIR, '..', '..', '.env.development.local'))
config = dotenv_values(ENV_PATH)

API_KEY = config.get("GEMINI_API_KEY")
REDIS_URL = config.get("REDIS_URL")
GENERATION_CONFIG = {
    "temperature": 2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

# session history
def get_redis_history(session_id: str):
    """Return the chat history for a specific session ID."""
    return RedisChatMessageHistory(session_id, redis_url=REDIS_URL)

# model
model = ChatGoogleGenerativeAI(model="gemini-2.0-flash",
                                generation_config=GENERATION_CONFIG, api_key=API_KEY)

# Parser
parser = JsonOutputParser(pydantic_object=Response)

# prompt
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

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
        ),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ]
)



# chain
chain = prompt | model

runnableWithHistory = RunnableWithMessageHistory(
    chain,
    get_redis_history,
    input_messages_key="input",
    history_messages_key="history",
)

async def get_ai_response(question: str, session_id: str = "default_id") -> Response:
    """Get a response from the Gemini model."""
    try:
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

# python3 -m api.app.services.gemini
# driver code
# if __name__ == "__main__":
#     import asyncio

#     async def main():
#         """driver code"""
#         response = await get_ai_response("add footer to it", "test_session_id")
#         print(response['explanation'])

#     asyncio.run(main())
