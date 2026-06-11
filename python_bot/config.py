import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
APPROVAL_CHANNEL_ID = os.getenv("APPROVAL_CHANNEL_ID", "") 
NETLIFY_APP_URL = os.getenv("NETLIFY_APP_URL", "") 
