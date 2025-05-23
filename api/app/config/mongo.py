"""This file is used to connect to the MongoDB database and export the chatsCollection object. """
import os
from pymongo import MongoClient
from pymongo.errors import ConfigurationError
from dotenv import dotenv_values

DIR = os.path.dirname(os.path.realpath(__file__))
ENV_PATH = os.path.abspath(os.path.join(DIR, '..', '..', '.env.development.local'))

config = dotenv_values(ENV_PATH)

try:
    URI = config.get("MONGO_URI")
    client = MongoClient(URI or "mongodb://localhost:27017/")
except ConfigurationError:
    print("MongoDB configuration error. Please check your connection string.")
    raise 
  
db = client["chat_db"]

chatsCollection = db["chats"]
tokensCollection = db["tokens"]

export = chatsCollection, tokensCollection

