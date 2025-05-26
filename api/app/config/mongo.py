"""Connect securely to MongoDB Atlas and export collections."""
import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError
import certifi
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def verify_connection():
    try:
        client.admin.command("ping")
        logger.info("Connected to MongoDB successfully.")
    except Exception as e:
        logger.error("MongoDB connection failed:", str(e))

try:
    uri = os.getenv("MONGO_URI")
    if not uri:
        raise ConfigurationError("MONGO_URI not found in environment variables.")
    
    client = MongoClient(
        uri,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )

    verify_connection() 

except (ConfigurationError, ServerSelectionTimeoutError) as e:
    logger.error(f"MongoDB connection error: {e}")
    raise RuntimeError("Failed to connect securely to MongoDB.")

db = client["chat_db"]
chatsCollection = db["chats"]
tokensCollection = db["tokens"]
