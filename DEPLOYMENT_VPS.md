# Deployment Guide

The platform has been completely rewritten from a legacy React/Node.js prototype into a pure **Python 3 Telegram Bot Architecture**, following your strict technical requests.

## 📂 New Structure
The whole project is located in `/python_bot`.
The web resources have been entirely deleted from root `/src`!

- `/python_bot/main.py`: The Aiogram bot entry point.
- `/python_bot/database.py`: The `asyncpg` PostgreSQL controller + schema creation.
- `/python_bot/handlers/user_handlers.py`: Captcha reception, Multi-step user registration, fetching OTP.
- `/python_bot/handlers/admin_handlers.py`: Comprehensive Admin Panel using high-quality Markdown layouts.
- `/python_bot/sms_api.py`: Directly queries `http://161.118.182.184:4000/sms/latest` without exposing APIs to users.
- `/netlify_captcha/index.html`: The ONLY HTML file left in the repository. Deploy this directly on Netlify, then set `NETLIFY_APP_URL` in the environment variables to link to it.

## ⚙ VPS / Alwaysdata Deployment

1. Download the workspace as a Zip.
2. Upload `/python_bot` to your VPS or Alwaysdata Python environment.
3. Establish your Virtual Environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Create `.env` inside the `python_bot` directory:
   ```env
   BOT_TOKEN=7.............:xxxxx
   DATABASE_URL=postgres://...
   APPROVAL_CHANNEL_ID=-100xxxxxxxxxx
   NETLIFY_APP_URL=https://your-domain.netlify.app
   ```
5. Add admin permissions manually in database:
   ```sql
   INSERT INTO admins (telegram_id) VALUES (YOUR_ID);
   ```
6. Run the bot natively:
   ```bash
   python3 main.py
   ```

## 🌐 Netlify Deployment
1. Upload the content of `/netlify_captcha/` into a new Netlify site.
2. The code natively calls `tg.sendData()` which works natively inside the Telegram Web App popup, safely transmitting the position data cleanly back to the Python bot without any external REST API needed.
