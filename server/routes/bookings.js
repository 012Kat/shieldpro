const express = require('express');
const router = express.Router();
const db = require('../database.js');

// Helper function to generate random 6-character ID
function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// POST create booking
router.post('/', async (req, res) => {
  const { name, email, phone, service, date, notes } = req.body;
  if (!name || !email || !phone || !service || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const bookingId = generateBookingId();

    const result = await db.query(
      `INSERT INTO bookings (id, name, email, phone, service, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [bookingId, name, email, phone, service, date, notes]
    );

    res.status(200).json({ message: 'Booking saved', id: result.rows[0].id });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, service, date, notes
       FROM bookings
       ORDER BY date DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error retrieving bookings:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE a booking
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Export to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bookings ORDER BY date DESC');
    let csv = 'ID,Name,Email,Phone,Service,Date,Notes\n';
    result.rows.forEach(row => {
      csv += `${row.id},"${row.name}","${row.email}","${row.phone}","${row.service}","${row.date}","${row.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
