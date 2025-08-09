const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');

// Function to generate a random 6-character alphanumeric ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// GET all admins (excluding passwords)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username FROM admins ORDER BY username ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error retrieving admins:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST create new admin
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const id = generateId();

    const result = await db.query(
      'INSERT INTO admins (id, username, password) VALUES ($1, $2, $3) RETURNING id, username',
      [id, username, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating admin:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE admin
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
