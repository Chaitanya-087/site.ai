"""This file is used to connect to the MongoDB database and export the chatsCollection object. """
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["chat_db"]
chatsCollection = db["chats"]

export = chatsCollection
