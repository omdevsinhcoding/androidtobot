import os
import asyncio
from telegram.ext import ApplicationBuilder
from dotenv import load_dotenv

import database
import telegram_bot

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

async def main():
    if not BOT_TOKEN:
        print("BOT_TOKEN is not set in .env")
        return
        
    pool = await database.get_pool()
    if pool:
        await database.init_db(pool)

    bot_app = ApplicationBuilder().token(BOT_TOKEN).build()
    bot_app.bot_data['db_pool'] = pool
    telegram_bot.setup_handlers(bot_app)
    
    print("🤖 Bot is starting...")
    await bot_app.initialize()
    await bot_app.start()
    await bot_app.updater.start_polling()
    
    print("🤖 Bot is running! Press Ctrl+C to stop.")
    
    # Keep the task running
    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        pass
    finally:
        await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
