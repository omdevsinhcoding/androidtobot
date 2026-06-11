import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ CRITICAL ERROR: DATABASE_URL environment variable is missing!");
}

// Pass the raw connection string without stripping query parameters
const db = new Pool({
  connectionString,
  // Automatically require SSL for remote databases
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Create an explicit init function so the server can await it
export async function initDb() {
  try {
    const client = await db.connect();
    console.log("✅ Successfully connected to database.");
    client.release();

    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        telegram_username TEXT,
        full_name TEXT,
        whatsapp TEXT,
        status TEXT DEFAULT 'pending',
        requested_services TEXT,
        assigned_services TEXT,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by BIGINT,
        last_active TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_access_log (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        service TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_id TEXT
      );

      CREATE TABLE IF NOT EXISTS admins (
        telegram_id BIGINT PRIMARY KEY,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by BIGINT
      );
    `);
    console.log("✅ Database tables verified.");
  } catch (err: any) {
    console.error("❌ CRITICAL ERROR: Failed to connect or initialize database!");
    console.error(err.message);
    throw err;
  }
}

export interface User {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  full_name: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  requested_services: string;
  assigned_services: string | null;
  registered_at: string;
  approved_at: string | null;
  approved_by: string | null;
  last_active: string | null;
}

export { db };

