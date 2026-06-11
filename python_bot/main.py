import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

from config import BOT_TOKEN
from database import get_db_pool, init_db
from handlers.user_handlers import router as user_router
from handlers.admin_handlers import router as admin_router

logging.basicConfig(level=logging.INFO)

async def main():
    if not BOT_TOKEN:
        logging.error("BOT_TOKEN is missing in the environment.")
        return

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    pool = await get_db_pool()
    if pool:
        await init_db(pool)
        
    dp["db_pool"] = pool
    dp["bot"] = bot
    
    dp.include_router(user_router)
    dp.include_router(admin_router)
    
    # Optionally, you can insert default admins or setup webhooks here.
    # For now, polling guarantees background execution purely for Telegram.

    logging.info("Starting polling...")
    try:
        await dp.start_polling(bot, drop_pending_updates=True)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
