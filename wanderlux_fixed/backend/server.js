// ═══════════════════════════════════════════════════════════
// server.js — Wanderlux Express Application Entry Point
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

// ── Import Routes ─────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const packagesRoutes     = require('./routes/packages');
const destinationsRoutes = require('./routes/destinations');
const wishlistRoutes     = require('./routes/wishlist');
const bookingsRoutes     = require('./routes/bookings');
const couponsRoutes      = require('./routes/coupons');
const reviewsRoutes      = require('./routes/reviews');
const transportRoutes    = require('./routes/transport');
const transactionsRoutes = require('./routes/transactions');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/packages',     packagesRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/wishlist',     wishlistRoutes);
app.use('/api/bookings',     bookingsRoutes);
app.use('/api/coupons',      couponsRoutes);
app.use('/api/reviews',      reviewsRoutes);
app.use('/api/transport',    transportRoutes);
app.use('/api',              transactionsRoutes); // payments, invoices, cancellations, support

// ── Health-check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Wanderlux API is running 🌍' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback — all other routes send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌍 Wanderlux server running at http://localhost:${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api/health\n`);
});
