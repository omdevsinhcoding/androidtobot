import os
import re
import json
import aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, 
    MessageHandler, filters, ContextTypes, ConversationHandler
)
from admin_panel import admin_command, admin_callback, admin_approval_callback

ASK_NAME, ASK_WA = range(2)

MINI_APP_URL = os.getenv("MINI_APP_URL", "")
APPROVAL_CHANNEL_ID = os.getenv("APPROVAL_CHANNEL_ID", "")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    pool = context.bot_data.get('db_pool')

    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE telegram_id = $1", user_id)

    if user and user['status'] == 'banned':
        await update.message.reply_text("❌ You are permanently banned from using this bot.")
        return

    if not user or not user['captcha_verified']:
        keyboard = [[InlineKeyboardButton("✅ Verify via Website", web_app=WebAppInfo(url=f"{MINI_APP_URL}"))]]
        await update.message.reply_text(
            "🛡 *Security Check Required*\n\nTo prevent abuse, please verify that you are human.\nClick the button below, allow location access on the site, and it will return you to the bot automatically.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if not user['full_name']:
        await update.message.reply_text("👋 Welcome! Let's get you registered.\nPlease enter your *Full Name*:", parse_mode="Markdown")
        return ASK_NAME

    if user['status'] == 'pending':
        await update.message.reply_text("⏳ Your request is still pending admin approval. Please wait.")
    elif user['status'] == 'rejected':
        keyboard = [[InlineKeyboardButton("🔄 Re-Apply", callback_data="reapply")]]
        await update.message.reply_text(
            "😔 *Application Declined*\n\nWe are sorry, but the admin did not verify you as a trusted user.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    elif user['status'] == 'approved':
        assigned = json.loads(user['assigned_services'] or '[]')
        if not assigned:
            await update.message.reply_text("✅ You are approved, but no services have been assigned to you yet.")
            return
            
        async with pool.acquire() as conn:
            services = await conn.fetch("SELECT * FROM services WHERE id = ANY($1::int[])", [int(x) for x in assigned])
            
        keyboard = []
        for s in services:
            keyboard.append([InlineKeyboardButton(f"📦 Get {s['name']}", callback_data=f"fetch_otp_{s['id']}")])
            
        await update.message.reply_text(
            f"👋 *Hello, {update.effective_user.first_name}!*\nWelcome back to OTP Vault.\nHere are your approved services:",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    return ConversationHandler.END

async def ask_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    name = update.message.text.strip()
    if len(name) < 2:
        await update.message.reply_text("Please enter a valid full name:")
        return ASK_NAME
    
    context.user_data['full_name'] = name
    await update.message.reply_text("Great! Now enter your *WhatsApp Number* (with country code, e.g. +91XXXXXXXXXX):", parse_mode="Markdown")
    return ASK_WA

async def ask_wa(update: Update, context: ContextTypes.DEFAULT_TYPE):
    wa = update.message.text.strip()
    if not re.match(r"^\+[1-9]\d{7,14}$", wa):
        await update.message.reply_text("Invalid format. Enter your WhatsApp number (e.g. +91XXXXXXXXXX):")
        return ASK_WA
        
    context.user_data['whatsapp'] = wa
    
    user_id = update.effective_user.id
    username = update.effective_user.username
    pool = context.bot_data.get('db_pool')
    
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE users SET full_name = $1, whatsapp = $2, telegram_username = $3, status = 'pending'
            WHERE telegram_id = $4
        """, context.user_data['full_name'], wa, username, user_id)
        
    await update.message.reply_text("🎉 *Request Submitted!*\n\nYour application has been sent to the admins. You will be notified once it is reviewed.", parse_mode="Markdown")
    
    if APPROVAL_CHANNEL_ID:
        admin_msg = f"━━━━━━━━━━━━━━━━━━━━━━━━\n🆕 *NEW ACCESS REQUEST*\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Name: {context.user_data['full_name']}\n📱 WhatsApp: {wa}\n🆔 Telegram ID: `{user_id}`\n━━━━━━━━━━━━━━━━━━━━━━━━"
        keyboard = [
            [InlineKeyboardButton("✅ Approve", callback_data=f"admin_approve_{user_id}"), 
             InlineKeyboardButton("❌ Decline", callback_data=f"admin_decline_{user_id}")]
        ]
        try:
            await context.bot.send_message(APPROVAL_CHANNEL_ID, admin_msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        except: pass
        
    return ConversationHandler.END

async def handle_fetch_otp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    service_id = int(query.data.split("_")[2])
    await query.answer("Fetching OTP...")
    
    pool = context.bot_data.get('db_pool')
    async with pool.acquire() as conn:
        service = await conn.fetchrow("SELECT * FROM services WHERE id = $1", service_id)
        
    if not service:
        await query.message.reply_text("Service not found.")
        return
        
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://161.118.182.184:4000/sms/latest", timeout=3) as res:
                data = await res.json()
                
        if data and data.get("text") and re.search(service['match_text'], data["text"], re.IGNORECASE):
            await query.message.reply_text(
                f"📩 *{service['name']} OTP:*\n\n`{data['otp']}`\n\n_Full Message:_\n{data['text']}", 
                parse_mode="Markdown"
            )
        else:
            await query.message.reply_text(f"⏳ No recent OTP found for {service['name']}. Try again in a few seconds.")
    except Exception as e:
        await query.message.reply_text("Failed to fetch OTP. Ensure API is running.")

async def handle_webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username
    first_name = update.effective_user.first_name
    pool = context.bot_data.get('db_pool')
    
    data = update.effective_message.web_app_data.data
    try:
        parsed = json.loads(data)
        if parsed.get('verified'):
            lat = parsed.get('lat')
            lon = parsed.get('lon')
            loc_str = f"{lat},{lon}"
            
            async with pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO users (telegram_id, telegram_username, full_name, status, captcha_verified, location_data)
                    VALUES ($1, $2, $3, 'pending', TRUE, $4)
                    ON CONFLICT(telegram_id) DO UPDATE SET
                      captcha_verified = TRUE,
                      location_data = excluded.location_data
                """, user_id, username, first_name, loc_str)
                
            await update.message.reply_text("✅ *Verification successful!*\n\nLet's get you registered.\nPlease enter your *Full Name*:", parse_mode="Markdown")
            return ASK_NAME
    except Exception as e:
        await update.message.reply_text("❌ Verification failed. Please try again.")
    return ConversationHandler.END

def setup_handlers(application: Application):
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("start", start_command),
            MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data)
        ],
        states={
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_name)],
            ASK_WA: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_wa)]
        },
        fallbacks=[]
    )
    application.add_handler(conv_handler)
    
    application.add_handler(CommandHandler("admin", admin_command))
    application.add_handler(CallbackQueryHandler(admin_callback, pattern="^ad_"))
    application.add_handler(CallbackQueryHandler(admin_approval_callback, pattern="^(admin_approve_|admin_decline_|aa_toggle_|aa_confirm_)"))
    application.add_handler(CallbackQueryHandler(handle_fetch_otp, pattern="^fetch_otp_"))
