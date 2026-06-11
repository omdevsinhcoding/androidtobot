from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
import json

router = Router()

async def is_admin(db_pool, tg_id: int):
    async with db_pool.acquire() as conn:
        count = await conn.fetchval("SELECT count(*) FROM admins WHERE telegram_id = $1", tg_id)
        return count > 0

@router.message(Command("admin"))
async def admin_panel_handler(message: Message, db_pool):
    if not await is_admin(db_pool, message.from_user.id):
        return
        
    async with db_pool.acquire() as conn:
        total = await conn.fetchval("SELECT count(*) FROM users")
        pending = await conn.fetchval("SELECT count(*) FROM users WHERE status = 'pending'")
        
    msg = f"👑 *Secure Admin Dashboard*\n\n👥 Total Users: {total}\n⏳ Pending Review: {pending}"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👥 Accounts Overview", callback_data="ad_accs")],
        [InlineKeyboardButton(text="📦 Services Management", callback_data="ad_svcs")],
        [InlineKeyboardButton(text="📢 Platform Broadcast", callback_data="ad_cast")],
        [InlineKeyboardButton(text="📊 Activity Analytics", callback_data="ad_stat")],
        [InlineKeyboardButton(text="🛠 Global Settings", callback_data="ad_set")]
    ])
    await message.answer(msg, reply_markup=kb, parse_mode="Markdown")

@router.callback_query(F.data.startswith("ad_review_"))
async def admin_review_user(callback: CallbackQuery, db_pool):
    tg_id = callback.from_user.id
    if not await is_admin(db_pool, tg_id):
        await callback.answer("Unauthorized.", show_alert=True)
        return
        
    target_id = int(callback.data.split("_")[2])
    
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE telegram_id = $1", target_id)
        if not user:
            await callback.answer("User record missing.", show_alert=True)
            return
            
        services = await conn.fetch("SELECT * FROM services")
        
    assigned = set(json.loads(user['assigned_services']))
    
    buttons = []
    for s in services:
        mark = "✅ " if s['id'] in assigned else "☐ "
        buttons.append([InlineKeyboardButton(text=f"{mark} {s['name']}", callback_data=f"ad_tog_{target_id}_{s['id']}")])
        
    buttons.append([InlineKeyboardButton(text="🚀 Approve Account & Assign", callback_data=f"ad_approve_{target_id}")])
    
    await callback.message.reply(
        f"⚙️ *Assign Services to {user['full_name']}* (`{target_id}`):",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
        parse_mode="Markdown"
    )
    await callback.answer()

@router.callback_query(F.data.startswith("ad_tog_"))
async def admin_toggle_service(callback: CallbackQuery, db_pool):
    tg_id = callback.from_user.id
    if not await is_admin(db_pool, tg_id):
        return
        
    parts = callback.data.split("_")
    target_id = int(parts[2])
    svc_id = int(parts[3])
    
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE telegram_id = $1", target_id)
        assigned = set(json.loads(user['assigned_services']))
        
        if svc_id in assigned:
            assigned.remove(svc_id)
        else:
            assigned.add(svc_id)
            
        await conn.execute("UPDATE users SET assigned_services = $1 WHERE telegram_id = $2", json.dumps(list(assigned)), target_id)
        
        services = await conn.fetch("SELECT * FROM services")
        
    buttons = []
    for s in services:
        mark = "✅ " if s['id'] in assigned else "☐ "
        buttons.append([InlineKeyboardButton(text=f"{mark} {s['name']}", callback_data=f"ad_tog_{target_id}_{s['id']}")])
        
    buttons.append([InlineKeyboardButton(text="🚀 Approve Account & Assign", callback_data=f"ad_approve_{target_id}")])
    
    await callback.message.edit_reply_markup(reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons))
    await callback.answer()

@router.callback_query(F.data.startswith("ad_approve_"))
async def admin_approve_final(callback: CallbackQuery, bot: Bot, db_pool):
    if not await is_admin(db_pool, callback.from_user.id): return
    target_id = int(callback.data.split("_")[2])
    
    async with db_pool.acquire() as conn:
        await conn.execute("UPDATE users SET status = 'approved' WHERE telegram_id = $1", target_id)
        
    await callback.message.edit_text("✅ User strictly approved and services fully assigned.")
    
    try:
        await bot.send_message(target_id, "🎉 *Congratulations!*\n\nYour account has been audited and approved by administrators.\n\nType /start to access your assigned secure services.", parse_mode="Markdown")
    except: pass
    await callback.answer()

@router.callback_query(F.data.startswith("ad_decline_"))
async def admin_decline(callback: CallbackQuery, bot: Bot, db_pool):
    if not await is_admin(db_pool, callback.from_user.id): return
    target_id = int(callback.data.split("_")[2])
    
    async with db_pool.acquire() as conn:
        await conn.execute("UPDATE users SET status = 'rejected' WHERE telegram_id = $1", target_id)
        
    await callback.message.edit_text("❌ Request declined and user notified.")
    try:
        kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🔄 Request Overturn", callback_data="reapply")]])
        await bot.send_message(target_id, "😔 *Access Denied*\n\nYour application did not pass our strict security audits at this time.", reply_markup=kb, parse_mode="Markdown")
    except: pass
    await callback.answer()
