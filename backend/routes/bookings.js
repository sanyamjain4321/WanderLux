// routes/bookings.js
const express = require('express');
const router  = express.Router();
const {
  createBooking,
  getMyTrips,
  getBookingById,
  cancelBooking
} = require('../controllers/bookingsController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(protect);

// POST  /api/bookings               — create new booking
router.post('/',          createBooking);

// GET   /api/bookings/my-trips      — all bookings for logged-in user
router.get('/my-trips',   getMyTrips);

// GET   /api/bookings/:id           — single booking detail
router.get('/:id',        getBookingById);

// PATCH /api/bookings/:id/cancel    — cancel a booking
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
