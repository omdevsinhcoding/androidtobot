import 'dotenv/config';
import { Router } from "express";
import axios from "axios";
import { db, User } from "../db/index.js";
import { setupBot } from "../bot/index.js";

export const apiRouter = Router();

// Middleware for everything else
apiRouter.use(async (req, res, next) => {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: "Missing x-telegram-id header" });
  
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    const user = rows[0] as User;
    
    // Check if admin
    const adminCheck = await db.query('SELECT 1 FROM admins WHERE telegram_id = $1', [telegramId]);
    const isAdmin = adminCheck.rows.length > 0;

    if (!user && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (user && user.status !== 'approved' && !isAdmin) {
       return res.status(403).json({ error: "Access denied" });
    }

    (req as any).user = user;
    (req as any).isAdmin = isAdmin;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

apiRouter.get("/user/me", (req, res) => {
  const user = (req as any).user as User;
  const isAdmin = (req as any).isAdmin as boolean;
  res.json({ ...user, isAdmin });
});

apiRouter.get("/admin/users", async (req, res) => {
  if (!(req as any).isAdmin) return res.status(403).json({ error: "Admin only" });
  try {
    const { rows } = await db.query("SELECT * FROM users ORDER BY registered_at DESC");
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/admin/users/:telegramId/status", async (req, res) => {
  if (!(req as any).isAdmin) return res.status(403).json({ error: "Admin only" });
  try {
    const { status } = req.body;
    const { telegramId } = req.params;
    
    if (!['approved', 'rejected', 'banned'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (status === 'approved') {
      // Upon approval via Web UI, assign their originally requested services to them automatically
      await db.query(`
        UPDATE users 
        SET status = $1, assigned_services = requested_services, approved_at = CURRENT_TIMESTAMP 
        WHERE telegram_id = $2
      `, [status, telegramId]);
    } else {
      await db.query("UPDATE users SET status = $1 WHERE telegram_id = $2", [status, telegramId]);
    }
    
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/sms/latest", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT value FROM settings WHERE key = 'API_URL'");
    const apiUrl = rows[0]?.value;
    if (!apiUrl) return res.json({});
    const { data } = await axios.get(`${apiUrl}/sms/latest`, { timeout: 3000 });
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching latest SMS:", error.message);
    res.json({});
  }
});

apiRouter.get("/sms", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT value FROM settings WHERE key = 'API_URL'");
    const apiUrl = rows[0]?.value;
    if (!apiUrl) return res.json([]);
    const { data } = await axios.get(`${apiUrl}/sms/`, { timeout: 3000 });
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching SMS:", error.message);
    res.json([]);
  }
});
