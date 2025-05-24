"""This file is used to connect to the MongoDB database and export the chatsCollection, tokensCollection object. """
import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConfigurationError

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

uri = "mongodb://localhost:27017/"

try:
    URI = os.environ.get("MONGO_URI")
    client = MongoClient(URI)
except ConfigurationError:
    logger.error("MongoDB configuration error. Please check your connection string.")
    raise RuntimeError("Invalid MongoDB URI configuration.")

db = client["chat_db"]

chatsCollection = db["chats"]
tokensCollection = db["tokens"]

export = chatsCollection, tokensCollection
