// ═══════════════════════════════════════════════════════════
// controllers/authController.js — Register, Login, Me
// ═══════════════════════════════════════════════════════════

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ─── Helper: generate JWT ──────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── POST /api/auth/register ───────────────────────────────
const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Basic validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const fullName = `${first_name.trim()} ${last_name.trim()}`;

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email.toLowerCase().trim(), hashed]
    );

    const user = { id: result.insertId, name: fullName, email };
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { user_id: user.id, first_name, last_name, email }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── POST /api/auth/login ──────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user
    const [rows] = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const names = user.name.split(' ');
    const first_name = names[0];
    const last_name = names.slice(1).join(' ');

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        user_id:    user.id,
        first_name: first_name,
        last_name:  last_name,
        email:      user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── GET /api/auth/me (protected) ─────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, nationality, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Count bookings for profile stats
    const [bookingStats] = await db.query(
      `SELECT COUNT(*) as total_trips, COALESCE(SUM(total_amount), 0) as total_spent
       FROM bookings WHERE user_id = ? AND status != 'cancelled'`,
      [req.user.id]
    );

    const user = rows[0];
    const names = user.name.split(' ');
    const first_name = names[0];
    const last_name = names.slice(1).join(' ');

    res.json({
      success: true,
      user: {
        ...user,
        user_id: user.id,
        first_name,
        last_name,
        total_trips:  bookingStats[0].total_trips,
        total_spent:  bookingStats[0].total_spent
      }
    });

  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/auth/me (protected) ─────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const fullName = `${first_name.trim()} ${last_name.trim()}`;
    await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [fullName, email.toLowerCase().trim(), req.user.id]
    );

    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

module.exports = { register, login, getMe, updateProfile };
