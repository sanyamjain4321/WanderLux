// routes/reviews.js
const express = require('express');
const router  = express.Router();
const { getReviews, createReview } = require('../controllers/reviewsController');
const { protect } = require('../middleware/authMiddleware');

// GET  /api/reviews             — all approved reviews (optional ?packageId=)
router.get('/',  getReviews);

// POST /api/reviews             — submit a review (requires login)
router.post('/', protect, createReview);

module.exports = router;
