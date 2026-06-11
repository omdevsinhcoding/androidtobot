# OTP Bot VPS Deployment Guide

This guide explains how to deploy the OTP bot using PM2 and Nginx (Reverse Proxy) for a production-ready environment.

## 1. Get Your Code on VPS
Since we don't have hardcoded secrets, you can safely clone your GitHub repo to your VPS:
```bash
git clone https://github.com/yourusername/androidtobot.git ~/androidtobot
cd ~/androidtobot
```

## 2. Install & Build
Install NodeJS dependencies and build the TypeScript application into vanilla JavaScript.

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## 3. Database & Secret Configuration (.env file)

We are using a `.env` file for your required startup secrets. It never gets pushed to GitHub because it's ignored by `.gitignore`.

**1. Create the `.env` file on your VPS:**
```bash
nano ~/androidtobot/.env
```

**2. Add your credentials (including your domain):**
```env
# Required for Boot:
DATABASE_URL="postgresql://neondb_owner:password@your-neon-url.aws.neon.tech/neondb?sslmode=require"

# Your Telegram Bot Token
BOT_TOKEN="1234567890:AAH-xxxxx"

# Your exact permanent domain (MUST use https)
MINI_APP_URL="https://yourdomain.com"
```
*(Save and exit nano: `Ctrl+O`, `Enter`, `Ctrl+X`)*

## 4. Deploy and Run with PM2
Now, spin up the server permanently in the background. Nginx will route public traffic to port 3021.

```bash
# Start the production build explicitly in production mode
NODE_ENV=production pm2 start dist/server.cjs --name "otp_bot"

# Save list so it boots automatically if VPS restarts
pm2 save
```

## 5. Nginx Setup (Reverse Proxy)
To expose your bot securely via your domain without exposing port 3021 directly.

**1. Install Nginx:**
```bash
sudo apt update
sudo apt install nginx -y
```

**2. Create a new Nginx configuration for your domain:**
```bash
sudo nano /etc/nginx/sites-available/otp_bot
```

**3. Paste the following configuration (replace `yourdomain.com` with your actual domain):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**4. Enable the site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/otp_bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. Secure it with SSL (Let's Encrypt / Certbot / Cloudflare):**
If you are using Cloudflare DNS set to "Proxied" (Orange Cloud), ensure your SSL mode in Cloudflare is set to "Flexible" or "Full". If you prefer Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 6. How to Un-Install Pre-Existing Cloudflare Tunnels (If applicable)
If you previously used TryCloudflare tunnels and need to wipe them:

**1. Stop and delete the tunnel from PM2:**
```bash
pm2 stop cloudflare-tunnel
pm2 delete cloudflare-tunnel
pm2 save --force
```

**2. Uninstall cloudflared from your system completely:**
```bash
sudo dpkg -r cloudflared
sudo rm -rf ~/.cloudflared
sudo rm /etc/cloudflared/config.yml
```

**3. Verify PM2:**
```bash
pm2 list
# The only thing listed should be otp_bot!
```

## 7. Optional: Specify other configuration directly in Neon DB:
If you prefer not placing everything inside `.env`, you can update things without touching code directly via Neon DB!

1. Open your Neon DB Console -> SQL Editor.
2. Run this command manually to set up your Channel ID:
```sql
INSERT INTO settings (key, value) VALUES ('APPROVAL_CHANNEL_ID', '-100xxxxxxx');
```
3. Run this command to set up your API URL:
```sql
INSERT INTO settings (key, value) VALUES ('API_URL', 'http://YOUR_API_IP_HERE:4000');
```
4. Finally, restart your bot on VPS so it pulls the fresh data from the Database!
```bash
pm2 restart otp_bot
```
