// routes/wishlist.js
const express = require('express');
const router  = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getWishlistIds
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// All wishlist routes require authentication
router.use(protect);

// GET    /api/wishlist            — full wishlist with package details
router.get('/',          getWishlist);

// GET    /api/wishlist/ids        — just package IDs (for heart highlighting)
router.get('/ids',       getWishlistIds);

// POST   /api/wishlist/:packageId — add to wishlist
router.post('/:packageId',    addToWishlist);

// DELETE /api/wishlist/:packageId — remove from wishlist
router.delete('/:packageId',  removeFromWishlist);

module.exports = router;
