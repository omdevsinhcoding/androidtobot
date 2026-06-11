import 'dotenv/config';
import { Pool } from 'pg';

// Safely use the connection string provided in the env
const connectionString = process.env.DATABASE_URL;

// Strip sslmode from the connection string to prevent pg driver warnings
let cleanConnectionString = connectionString || "postgres://localhost:5432/otp_bot";
try {
  const url = new URL(cleanConnectionString);
  url.search = '';
  cleanConnectionString = url.toString();
} catch (e) {}

if (!connectionString) {
  console.error("❌ CRITICAL ERROR: DATABASE_URL environment variable is missing!");
  console.error("Please add it to your .env file or environment variables.");
}

const db = new Pool({
  connectionString: cleanConnectionString,
  ssl: cleanConnectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Test connection on startup without exiting process
db.connect()
  .then(client => {
    console.log("✅ Successfully connected to database.");
    client.release();
  })
  .catch(err => {
    console.error("❌ CRITICAL ERROR: Failed to connect to database!");
    console.error("Check your DATABASE_URL password and credentials.");
    console.error(err.message);
    // process.exit(1); -> Removed to prevent PM2 crash loops while user configures DB
  });


// Initialize tables
db.query(`
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
`).catch(console.error);

export interface User {
  id: number;
  telegram_id: string; // BIGINT from postgres often comes as string
  telegram_username: string | null;
  full_name: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  requested_services: string; // JSON string
  assigned_services: string | null; // JSON string
  registered_at: string;
  approved_at: string | null;
  approved_by: string | null;
  last_active: string | null;
}

export { db };

