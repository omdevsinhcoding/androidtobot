import asyncpg
import json
from config import DATABASE_URL

async def get_db_pool():
    if not DATABASE_URL:
        print("DATABASE_URL is missing!")
        return None
        
    ssl_ctx = False if 'localhost' in DATABASE_URL else 'require'
    return await asyncpg.create_pool(DATABASE_URL, ssl=ssl_ctx)

async def init_db(pool: asyncpg.Pool):
    async with pool.acquire() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                telegram_id BIGINT PRIMARY KEY,
                username TEXT,
                full_name TEXT,
                whatsapp TEXT,
                status TEXT DEFAULT 'pending', -- pending, approved, rejected, banned
                captcha_verified BOOLEAN DEFAULT FALSE,
                location_data TEXT,
                requested_services TEXT DEFAULT '[]',
                assigned_services TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                match_text TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS admins (
                telegram_id BIGINT PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT,
                action TEXT,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # Check defaults
        count = await conn.fetchval('SELECT count(*) FROM services')
        if count == 0:
            await conn.execute('''
                INSERT INTO services (name, match_text) VALUES 
                ('Netflix', 'Netflix'),
                ('SonyLiv', 'SonyLiv'),
                ('Hotstar', 'Hotstar')
            ''')
