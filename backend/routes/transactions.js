// ═══════════════════════════════════════════════════════════
// routes/transactions.js
// Payments, Invoices, Cancellations, Customer Support routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const {
  createPayment,
  getMyPayments,
  getMyInvoices,
  getInvoiceByBooking,
  cancelAndDelete,
  getMyCancellations,
  createTicket,
  getMyTickets
} = require('../controllers/transactionsController');

// ── PAYMENTS ──────────────────────────────────────────────
// POST   /api/payments              — record payment for a booking
// GET    /api/payments/my           — all payments for current user
router.post('/payments',          protect, createPayment);
router.get('/payments/my',        protect, getMyPayments);

// ── INVOICES ──────────────────────────────────────────────
// GET    /api/invoices/my                    — all invoices for current user
// GET    /api/invoices/booking/:booking_id   — invoice for specific booking
router.get('/invoices/my',                  protect, getMyInvoices);
router.get('/invoices/booking/:booking_id', protect, getInvoiceByBooking);

// ── CANCELLATIONS ─────────────────────────────────────────
// POST   /api/cancellations/:booking_id — cancel + delete booking
// GET    /api/cancellations/my          — cancellation history
router.post('/cancellations/:booking_id', protect, cancelAndDelete);
router.get('/cancellations/my',           protect, getMyCancellations);

// ── CUSTOMER SUPPORT ──────────────────────────────────────
// POST   /api/support           — submit a support ticket (auth optional)
// GET    /api/support/my        — my tickets (auth required)
router.post('/support',    optionalProtect, createTicket);   // guests can also submit
router.get('/support/my',  protect, getMyTickets);

module.exports = router;
