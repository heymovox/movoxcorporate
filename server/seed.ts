/**
 * Seed script — creates the default admin user.
 * Run: npx tsx server/seed.ts
 */
import { pool } from './db.js';
import bcrypt from 'bcrypt';

const DEFAULT_EMAIL = 'admin@heymovox.com';
const DEFAULT_PASSWORD = 'admin123';

async function seed() {
  try {
    const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [DEFAULT_EMAIL]);
    if (existing.rows.length > 0) {
      console.log(`Admin user ${DEFAULT_EMAIL} already exists.`);
      await pool.end();
      return;
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role, company)
       VALUES ($1, $2, 'Administrator', 'admin', 'MovoX')`,
      [DEFAULT_EMAIL, hash],
    );
    console.log(`✓ Admin user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
    console.log('  Change this password immediately after first login!');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
