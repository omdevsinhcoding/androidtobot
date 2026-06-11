# AlwaysData Deployment Guide

Since this codebase is a **Full-Stack Node.js Application** (it runs both the Telegram Bot and the Express API server that serves your React app synchronously), you do **not** need a Python environment. You only need a single **Node.js Site** on AlwaysData.

Also, as requested, **no environment variables or `.env` files are needed on the AlwaysData dashboard**. All secrets (Bot Token, DB connections, API Base) are securely read directly from your PostgreSQL Database or hardcoded where needed.

## Step 1: Prepare Your Code
1. Ensure your codebase is fully up to date and your PostgreSQL connection string is correctly configured in `src/db/index.ts`.
2. Build the project locally (or pull it on your server) to generate the production bundle:
```bash
npm install
npm run build
```
This generates a standalone `dist/server.cjs` file which contains the backend logic (including the Bot) and compiles your React files into the `dist/` folder.

## Step 2: Set up the AlwaysData Site
1. Log in to your **AlwaysData Control Panel**.
2. Go to **Web -> Sites** on the left menu.
3. Click **Add a new site**.
4. Configure the site:
   - **Addresses / URLs**: Add the domain or subdomain you want to use (e.g., `yourapp.alwaysdata.net`).
   - **Type**: Select **Node.js**.
   - **Command**: Enter the following start command:
     `node dist/server.cjs`
   - **Working directory**: Enter `/www/your-project-folder` (this must match the folder where you will upload the code).
   - **Node.js Version**: Choose the latest stable version (v18 or v20).
   - **Environment Variables**: Leave blank! (You don't need `.env`).
5. Click **Submit** to create the site.

## Step 3: Upload Files and Install Dependencies
*(AlwaysData uses `process.env.PORT` automatically behind the scenes to route web traffic to your Node server, and our `server.ts` is already configured to catch it without any manual input).*

You need to upload the required files to your AlwaysData account:

### The Best Way (Via SSH):
1. Connect to your Alwaysdata account via SSH.
2. Navigate to your working directory: `cd /www/your-project-folder`
3. Upload your code files (you can use Git to clone it, or upload the zip file and extract it).
4. Build the application directly on Alwaysdata:
   ```bash
   npm install
   npm run build
   ```
*(Note: Because we use `--packages=external` when building, the `node_modules` directory is required for the backend to start up successfully)*.

## Step 4: Restart the Application
Once the code is populated and `node_modules` exists:
1. Go back to **Web -> Sites** in the AlwaysData Control Panel.
2. Click the **Restart** (circular arrow) button next to your Node.js site to launch the bot and web server simultaneously.
3. Check the **Logs** tab in AlwaysData if you need to debug.

You are fully deployed! The Telegraf bot is running, reading tokens dynamically from your Postgres database, and the Express server is handling your React Mini App on the domain.
