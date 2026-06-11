import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const db = new Pool({ connectionString });

async function seed() {
  try {
    console.log("Seeding test user...");
    await db.query(`
      INSERT INTO users (telegram_id, telegram_username, full_name, status, assigned_services)
      VALUES (1122334455, 'test_user', 'Test Admin', 'approved', '["All sms"]')
      ON CONFLICT (telegram_id) DO UPDATE SET 
        status = 'approved', 
        assigned_services = '["All sms"]';
    `);
    console.log("Seed successful.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await db.end();
  }
}

seed();
