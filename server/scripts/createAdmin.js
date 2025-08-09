// createAdmin.js
// Script to create an initial admin user in the database

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// DB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/shieldpro_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Admin credentials to insert
const username = 'admin';
const password = 'secure123';

bcrypt.hash(password, 10, async (err, hash) => {
  if (err) throw err;

  try {
    const result = await pool.query(
      'INSERT INTO admins (id, username, password) VALUES ($1, $2, $3) RETURNING id',
      ['INIT01', username, hash] // 'INIT01' is the first admin ID
    );
    console.log('✅ Admin created successfully with ID:', result.rows[0].id);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    pool.end();
  }
});
