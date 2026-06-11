import os
import asyncpg
import json
from datetime import datetime

async def get_pool():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is missing!")
        return None
        
    ssl_context = False if 'localhost' in db_url else 'require'
    return await asyncpg.create_pool(db_url, ssl=ssl_context)

async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                telegram_id BIGINT PRIMARY KEY,
                full_name TEXT,
                whatsapp TEXT,
                telegram_username TEXT,
                status TEXT DEFAULT 'pending',
                assigned_services TEXT,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                captcha_verified BOOLEAN DEFAULT FALSE,
                location_data TEXT
            );

            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                match_text TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS admins (
                telegram_id BIGINT PRIMARY KEY
            );
        ''')
        
        # Check defaults
        count = await conn.fetchval('SELECT count(*) FROM services')
        if count == 0:
            await conn.execute('''
                INSERT INTO services (name, match_text) VALUES 
                ('Netflix OTP', 'Netflix'),
                ('SonyLiv OTP', 'SonyLiv'),
                ('Hotstar OTP', 'Hotstar')
            ''')
