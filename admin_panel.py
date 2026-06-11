from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
import json

async def is_admin(pool, user_id: int) -> bool:
    async with pool.acquire() as conn:
        count = await conn.fetchval('SELECT count(*) FROM admins WHERE telegram_id = $1', user_id)
        return count > 0

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    pool = context.bot_data.get('db_pool')
    
    if not await is_admin(pool, user_id):
        return

    async with pool.acquire() as conn:
        users = await conn.fetchval("SELECT count(*) FROM users")
        pending = await conn.fetchval("SELECT count(*) FROM users WHERE status = 'pending'")

    message = f"👑 *Admin Panel*\n\n👥 Total Users: {users}\n⏳ Pending Requests: {pending}\n"

    keyboard = [
        [InlineKeyboardButton("👥 Verified Bot Users", callback_data="ad_users")],
        [InlineKeyboardButton("📦 Create Service", callback_data="ad_create_service"), 
         InlineKeyboardButton("🗑 Delete Service", callback_data="ad_del_service")],
        [InlineKeyboardButton("⚙️ Modify Service", callback_data="ad_mod_service"), 
         InlineKeyboardButton("📢 Broadcast", callback_data="ad_broadcast")],
        [InlineKeyboardButton("📊 Analytics", callback_data="ad_analytics"), 
         InlineKeyboardButton("🛠 Bot Settings", callback_data="ad_settings")],
        [InlineKeyboardButton("🆘 Support", callback_data="ad_support"), 
         InlineKeyboardButton("⛔ Ban Message", callback_data="ad_banmsg")],
        [InlineKeyboardButton("📝 Disclaimer", callback_data="ad_disc"), 
         InlineKeyboardButton("🏠 Home", callback_data="ad_home")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(message, parse_mode="Markdown", reply_markup=reply_markup)

async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    # Handle the admin UI actions here (stubbed for illustration)
    if query.data == "ad_users":
        await query.edit_message_text("Verified Users Menu...")
    elif query.data == "ad_create_service":
        await query.edit_message_text("Send the service name you want to create:")
    # Broadcast System
    elif query.data == "ad_broadcast":
        await query.edit_message_text(
            "📢 *Broadcast System*\n\nSend a message here to broadcast to all verified users.\nYou can include inline buttons using the format:\n`[Button Text|http://link.com]`",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back", callback_data="ad_home")]])
        )
    
    # Analytics Monitoring
    elif query.data == "ad_analytics":
        async with pool.acquire() as conn:
            total_users = await conn.fetchval("SELECT count(*) FROM users")
            approved = await conn.fetchval("SELECT count(*) FROM users WHERE status = 'approved'")
            rejected = await conn.fetchval("SELECT count(*) FROM users WHERE status = 'rejected'")
            banned = await conn.fetchval("SELECT count(*) FROM users WHERE status = 'banned'")
            
        stats = f"📊 *Analytics Monitoring*\n\nTotal Users: {total_users}\n✅ Approved: {approved}\n❌ Rejected: {rejected}\n⛔ Banned: {banned}"
        await query.edit_message_text(
            stats,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back", callback_data="ad_home")]])
        )
        
    elif query.data == "ad_home":
        # Call admin_command again or edit back to main menu
        users = await pool.fetchval("SELECT count(*) FROM users")
        pending = await pool.fetchval("SELECT count(*) FROM users WHERE status = 'pending'")
        message = f"👑 *Admin Panel*\n\n👥 Total Users: {users}\n⏳ Pending Requests: {pending}\n"
        keyboard = [
            [InlineKeyboardButton("👥 Verified Bot Users", callback_data="ad_users")],
            [InlineKeyboardButton("📦 Create Service", callback_data="ad_create_service"), 
             InlineKeyboardButton("🗑 Delete Service", callback_data="ad_del_service")],
            [InlineKeyboardButton("⚙️ Modify Service", callback_data="ad_mod_service"), 
             InlineKeyboardButton("📢 Broadcast", callback_data="ad_broadcast")],
            [InlineKeyboardButton("📊 Analytics", callback_data="ad_analytics"), 
             InlineKeyboardButton("🛠 Bot Settings", callback_data="ad_settings")],
            [InlineKeyboardButton("🆘 Support", callback_data="ad_support"), 
             InlineKeyboardButton("⛔ Ban Message", callback_data="ad_banmsg")],
            [InlineKeyboardButton("📝 Disclaimer", callback_data="ad_disc"), 
             InlineKeyboardButton("🏠 Home", callback_data="ad_home")]
        ]
        await query.edit_message_text(message, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await query.edit_message_text("🚧 Coming soon...", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back", callback_data="ad_home")]]))

async def admin_approval_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    user_id = update.effective_user.id
    pool = context.bot_data.get('db_pool')
    
    if not await is_admin(pool, user_id):
        await query.answer("Admin only.", show_alert=True)
        return

    if data.startswith("admin_approve_"):
        target_id = int(data.split("_")[2])
        async with pool.acquire() as conn:
            user = await conn.fetchrow('SELECT * FROM users WHERE telegram_id = $1', target_id)
            if not user:
                await query.answer("User not found.")
                return
            
            # Show service list for admin to assign
            services = await conn.fetch('SELECT * FROM services')
            
            keyboard = []
            for s in services:
                keyboard.append([InlineKeyboardButton(f"☐ {s['name']}", callback_data=f"aa_toggle_{target_id}_{s['id']}")])
            
            keyboard.append([InlineKeyboardButton("✅ Confirm & Approve", callback_data=f"aa_confirm_{target_id}")])
            
            context.bot_data[f"admin_temp_{target_id}"] = set()
            
            await update.effective_message.reply_text(
                f"Modifying services for {user['full_name']}:", 
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
            await query.answer("Check your bot DM.")
            
    elif data.startswith("admin_decline_"):
        target_id = int(data.split("_")[2])
        async with pool.acquire() as conn:
            await conn.execute("UPDATE users SET status = 'rejected' WHERE telegram_id = $1", target_id)
        
        try:
            await context.bot.send_message(target_id, "😔 *Application Declined*\n\nWe are sorry, but the admin did not verify you as a trusted user.", parse_mode="Markdown")
        except: pass
        
        await query.edit_message_text(f"{query.message.text}\n\n❌ Declined by admin.")

    elif data.startswith("aa_toggle_"):
        parts = data.split("_")
        target_id = int(parts[2])
        service_id = int(parts[3])
        
        selected = context.bot_data.get(f"admin_temp_{target_id}", set())
        if service_id in selected:
            selected.remove(service_id)
        else:
            selected.add(service_id)
            
        async with pool.acquire() as conn:
            services = await conn.fetch('SELECT * FROM services')

        keyboard = []
        for s in services:
            prefix = "✅" if s['id'] in selected else "☐"
            keyboard.append([InlineKeyboardButton(f"{prefix} {s['name']}", callback_data=f"aa_toggle_{target_id}_{s['id']}")])
        
        keyboard.append([InlineKeyboardButton("✅ Confirm & Approve", callback_data=f"aa_confirm_{target_id}")])
        
        await query.edit_message_reply_markup(InlineKeyboardMarkup(keyboard))

    elif data.startswith("aa_confirm_"):
        target_id = int(data.split("_")[2])
        selected = context.bot_data.get(f"admin_temp_{target_id}", set())
        
        if not selected:
            await query.answer("Select at least one service!")
            return
            
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET status = 'approved', assigned_services = $1 WHERE telegram_id = $2",
                json.dumps(list(selected)), target_id
            )
            
        await query.edit_message_text("✅ User Approved & Services Assigned.")
        
        try:
            await context.bot.send_message(
                target_id, 
                "🎉 *Congratulations!*\n\nYour application was approved by the admin! Type /start to see your services.", 
                parse_mode="Markdown"
            )
        except: pass
