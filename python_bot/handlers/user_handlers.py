from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
import json
import logging

from config import NETLIFY_APP_URL, APPROVAL_CHANNEL_ID
from sms_api import fetch_latest_matching_sms

router = Router()

class Registration(StatesGroup):
    waiting_for_name = State()
    waiting_for_whatsapp = State()

def main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Verify via Secure Portal", web_app=WebAppInfo(url=f"{NETLIFY_APP_URL}"))]
    ])

@router.message(CommandStart())
async def start_handler(message: Message, db_pool):
    tg_id = message.from_user.id
    username = message.from_user.username
    
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE telegram_id = $1", tg_id)
        
    if user and user['status'] == 'banned':
        await message.answer("❌ *Access Denied*\n\nYou are permanently banned from using this secure portal.", parse_mode="Markdown")
        return

    if not user or not user['captcha_verified']:
        await message.answer(
            "🛡 *Security Check Required*\n\nTo prevent abuse, please verify your location to prove you are human.\nClick the button below to complete verification.",
            reply_markup=main_keyboard(),
            parse_mode="Markdown"
        )
        return

    # If verified but no registration yet
    if not user['full_name']:
        await message.answer("👋 *Welcome!* Let's set up your profile.\nPlease enter your *Full Name*:", parse_mode="Markdown")
        return

    # Status checks
    if user['status'] == 'pending':
        await message.answer("⏳ *Review in Progress*\n\nYour application was strictly logged and is currently pending admin review.", parse_mode="Markdown")
    elif user['status'] == 'rejected':
        kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🔄 Re-Apply", callback_data="reapply")]])
        await message.answer("😔 *Application Declined*\n\nWe appreciate your interest, but your request has been declined at this time.", reply_markup=kb, parse_mode="Markdown")
    elif user['status'] == 'approved':
        assigned = json.loads(user['assigned_services'])
        if not assigned:
            await message.answer("✅ Your account is active, but no services are assigned yet.")
            return
            
        async with db_pool.acquire() as conn:
            services = await conn.fetch("SELECT * FROM services WHERE id = ANY($1::int[])", [int(x) for x in assigned])
            
        buttons = []
        for s in services:
            buttons.append([InlineKeyboardButton(text=f"📦 Get latest {s['name']} OTP", callback_data=f"fetch_otp_{s['id']}")])
            
        await message.answer(
            f"👋 *Welcome back, {user['full_name']}!*\n\nSelect a service below to fetch your secure OTP:",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
            parse_mode="Markdown"
        )

@router.message(F.web_app_data)
async def web_app_handler(message: Message, state: FSMContext, db_pool):
    tg_id = message.from_user.id
    username = message.from_user.username
    
    try:
        data = json.loads(message.web_app_data.data)
        if data.get("verified"):
            lat = data.get("lat")
            lon = data.get("lon")
            loc_str = f"{lat},{lon}"
            
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO users (telegram_id, username, status, captcha_verified, location_data)
                    VALUES ($1, $2, 'pending', TRUE, $3)
                    ON CONFLICT(telegram_id) DO UPDATE SET
                      captcha_verified = TRUE,
                      location_data = excluded.location_data
                """, tg_id, username, loc_str)
                
            await message.answer("✅ *Verification Successful!*\n\nPlease enter your *Full Name* to begin registration:", parse_mode="Markdown")
            await state.set_state(Registration.waiting_for_name)
    except Exception as e:
        logging.error(f"WebApp auth failed: {e}")
        await message.answer("❌ Verification failed. Please try again.")

@router.message(Registration.waiting_for_name)
async def get_name(message: Message, state: FSMContext):
    name = message.text.strip()
    if len(name) < 2:
        await message.answer("Please enter a valid full name.")
        return
        
    await state.update_data(full_name=name)
    await message.answer("Great! Now enter your *WhatsApp Number* (e.g., +91XXXXXXXXXX):", parse_mode="Markdown")
    await state.set_state(Registration.waiting_for_whatsapp)

@router.message(Registration.waiting_for_whatsapp)
async def get_whatsapp(message: Message, state: FSMContext, bot: Bot, db_pool):
    wa = message.text.strip()
    if not wa.startswith('+') or len(wa) < 10:
        await message.answer("Invalid format. Please include your country code (e.g., +91).")
        return
        
    user_data = await state.get_data()
    full_name = user_data['full_name']
    tg_id = message.from_user.id
    username = message.from_user.username
    
    # Let's ask them which services they want initially
    async with db_pool.acquire() as conn:
        services = await conn.fetch("SELECT * FROM services")
        await conn.execute("""
            UPDATE users SET full_name = $1, whatsapp = $2, username = $3
            WHERE telegram_id = $4
        """, full_name, wa, username, tg_id)
        
    # We simplified the flow by requesting all available options or showing generic request
    # Since requested services require inline buttons, we can just save it or prompt.
    # For now, submit generic to admin, and admin assigns everything manually easily!
    
    await state.clear()
    await message.answer("🎉 *Request Submitted!*\n\nYour profile has been forwarded to the administrators for strict review. You will be notified of the outcome.", parse_mode="Markdown")
    
    if APPROVAL_CHANNEL_ID:
        admin_msg = f"━━━━━━━━━━━━━━━━━━━━━━━━\n🆕 *NEW ACCESS REQUEST*\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Name:* {full_name}\n📱 *WhatsApp:* {wa}\n🆔 *Telegram ID:* `{tg_id}`\n━━━━━━━━━━━━━━━━━━━━━━━━"
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Review & Approve", callback_data=f"ad_review_{tg_id}")],
            [InlineKeyboardButton(text="❌ Decline Request", callback_data=f"ad_decline_{tg_id}")]
        ])
        try:
            await bot.send_message(APPROVAL_CHANNEL_ID, admin_msg, reply_markup=kb, parse_mode="Markdown")
        except:
            pass

@router.callback_query(F.data.startswith("fetch_otp_"))
async def fetch_otp_handler(callback: CallbackQuery, db_pool):
    service_id = int(callback.data.split("_")[2])
    
    async with db_pool.acquire() as conn:
        service = await conn.fetchrow("SELECT * FROM services WHERE id = $1", service_id)
        
    if not service:
        await callback.answer("Service error.", show_alert=True)
        return
        
    await callback.answer("Fetching secure OTP...", show_alert=False)
    
    success, data = await fetch_latest_matching_sms(service['match_text'])
    if success and data:
        msg = f"📩 *{service['name']} Secure OTP:*\n\n`{data['otp']}`\n\n_Original SMS:_\n{data['text']}\n_Timestamp: {data.get('formattedDate', 'Recent')}_"
        await callback.message.answer(msg, parse_mode="Markdown")
    else:
        await callback.message.answer(f"⏳ No secure OTP found matching {service['name']} locally. Try again later.")

@router.callback_query(F.data == "reapply")
async def handle_reapply(callback: CallbackQuery, state: FSMContext, db_pool):
    tg_id = callback.from_user.id
    async with db_pool.acquire() as conn:
        await conn.execute("UPDATE users SET status = 'pending' WHERE telegram_id = $1", tg_id)
    
    await callback.message.answer("📝 *Re-Application Started*\n\nPlease enter your *Full Name*:", parse_mode="Markdown")
    await state.set_state(Registration.waiting_for_name)
    await callback.answer()
