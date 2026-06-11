# Full System Deployment Guide: Oracle Cloud VPS

This guide provides a comprehensive walkthrough for deploying the **OTP Vault React Mini App** and the **Python Telegram Bot** on an Oracle Cloud VPS (Ubuntu).

---

## 🏗️ 1. Oracle Cloud Infrastructure (OCI) Firewall Setup

Before touching the server terminal, you **MUST** open the ports in the Oracle Cloud Console.

1.  Navigate to **Networking** > **Virtual Cloud Networks** > `Your VCN`.
2.  Click on **Security Lists** in the left sidebar.
3.  Click on the **Default Security List**.
4.  Add **Ingress Rules** for the following ports (Source CIDR: `0.0.0.0/0`):
    *   **TCP 80** (HTTP)
    *   **TCP 443** (HTTPS - for Telegram Webhooks and Frontend)
    *   **TCP 4000** (Backend API - if directly accessed)
    *   **TCP 3000** (Frontend Dev/Test - if directly accessed)

---

## 🐧 2. Server Preparation (Ubuntu)

Connect to your VPS:
```bash
ssh -i your_key.pem ubuntu@your_vps_ip
```

Install essential dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Fix Oracle's default iptables (Crucial):**
Oracle Ubuntu images have restrictive iptables by default that block traffic even if hardware firewall is open.
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 🤖 3. Deploying the Python Telegram Bot

1.  **Clone the project:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>/bot
    ```

2.  **Setup Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Create Systemd Service:**
    `sudo nano /etc/systemd/system/tgbot.service`

    Paste the following (Update paths and user):
    ```ini
    [Unit]
    Description=Telegram Bot Service
    After=network.target

    [Service]
    User=ubuntu
    WorkingDirectory=/home/ubuntu/<your-repo-name>
    Environment="BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN"
    Environment="API_URL=http://localhost:4000"
    ExecStart=/home/ubuntu/<your-repo-name>/venv/bin/python main.py
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```

4.  **Start the Bot:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable tgbot
    sudo systemctl start tgbot
    ```

---

## 🌐 4. Deploying the React Mini App (Frontend)

1.  **Build the App:**
    ```bash
    cd /home/ubuntu/<your-repo-name>
    npm install
    npm run build
    ```

2.  **Configure Nginx:**
    `sudo nano /etc/nginx/sites-available/bot-app`

    ```nginx
    server {
        listen 80;
        server_name your-subdomain.domain.com;

        location / {
            root /home/ubuntu/<your-repo-name>/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to backend if needed
        location /api/ {
            proxy_pass http://localhost:4000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

3.  **Enable and Restart:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/bot-app /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## ☁️ 5. Cloudflare & SSL

1.  **DNS Setup:**
    *   Point an `A` record (e.g., `bot.example.com`) to your `VPS_IP`.
    *   Set Proxy Status to **Proxied (Orange Cloud)**.

2.  **SSL Mode:**
    *   Go to Cloudflare **SSL/TLS** > **Overview**.
    *   Set mode to **Flexible** (Easiest, encrypts Cloudflare-to-User) or **Full** (Requires certificate on VPS).

3.  **Origin Certificate (Recommended for "Full" mode):**
    *   Generate a certificate in Cloudflare under **SSL/TLS** > **Origin Server**.
    *   Save `.pem` and `.key` files on your server.
    *   Update Nginx config to listen on `443 ssl` and point to these files.

---

## ✅ 6. Final Checklist
- [ ] OCI Ingress Rules added for 80/443?
- [ ] VPS iptables updated?
- [ ] Bot service running (`sudo systemctl status tgbot`)?
- [ ] Nginx config syntax ok (`sudo nginx -t`)?
- [ ] Telegram WebApp URL set to `https://your-subdomain.domain.com`?
