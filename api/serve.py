""" This file is used to run the FastAPI server. """
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == '__main__':
    PORT = os.environ.get("PORT", 8080)
    uvicorn.run("app.main:app",host="0.0.0.0",port=PORT,reload=True)
    