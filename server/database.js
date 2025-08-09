const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render will set this
  ssl: {
    rejectUnauthorized: false // Required for Render's PostgreSQL
  }
});

module.exports = pool;
