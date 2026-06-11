import psycopg2
import os
from psycopg2.extras import RealDictCursor

connection_string = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(connection_string, cursor_factory=RealDictCursor)

def get_system_settings():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT key, value FROM settings")
            rows = cur.fetchall()
            settings = {row['key']: row['value'] for row in rows}
            return settings
    finally:
        conn.close()

def get_bot_token():
    settings = get_system_settings()
    return settings.get('BOT_TOKEN')

def get_admin_ids():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT telegram_id FROM admins")
            rows = cur.fetchall()
            return [row['telegram_id'] for row in rows]
    finally:
        conn.close()

# Example Usage:
if __name__ == "__main__":
    print("Bot Token:", get_bot_token())
    print("Admins:", get_admin_ids())
