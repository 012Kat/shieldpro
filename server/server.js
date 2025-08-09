const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const db = require('./database');

// Routes
const bookingsRoute = require('./routes/bookings');
const adminsRoute = require('./routes/admins');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key', // use env var in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // secure cookies only in prod
  }
}));

//setup limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // example 15 minutes
  max: 100,
  keyGenerator: (req) => {
    // fallback to req.ip if header is invalid
    return req.ip;
  },
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // This line is key:
  trustProxy: true, 
});

app.use(limiter);
// Serve static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// 🔒 Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

// Serve admin login page from /public/admin
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/login.html'));
});

// Handle login
app.post('/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== 'string' || typeof password !== 'string' ||
    username.trim() === '' || password.trim() === ''
  ) {
    return res.status(400).send('Invalid input');
  }

  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.send('Invalid login credentials');

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = user.username;
      return res.redirect('/admin/dashboard');
    } else {
      return res.send('Invalid login credentials');
    }
  } catch (err) {
    console.error(err);
    return res.send('Internal error');
  }
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Dashboard route now points to /public/admin/dashboard.html
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }
  res.sendFile(path.join(__dirname, '../admin/dashboard.html'));
});

// API routes
app.use('/api/bookings', bookingsRoute);
app.use('/api/admins', adminsRoute);

// Catch-all route for frontend navigation (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Use process.env.PORT for Render, fallback to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
