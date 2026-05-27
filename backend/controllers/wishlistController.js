// ═══════════════════════════════════════════════════════════
// controllers/wishlistController.js — User Wishlist
// ═══════════════════════════════════════════════════════════

const db = require('../config/db');

// ─── GET /api/wishlist ─────────────────────────────────────
const getWishlist = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT w.package_id as package_id, w.added_at,
              p.title, p.location, p.duration, p.price_usd as price, p.rating,
              p.reviews, p.badge
       FROM wishlist w
       JOIN packages p ON p.id = w.package_id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, wishlist: items });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
};

// ─── POST /api/wishlist/:packageId ────────────────────────
const addToWishlist = async (req, res) => {
  try {
    const { packageId } = req.params;

    // Check package exists
    const [pkg] = await db.query('SELECT id FROM packages WHERE id = ?', [packageId]);
    if (!pkg.length) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    // INSERT IGNORE prevents duplicate error (UNIQUE constraint)
    await db.query(
      'INSERT IGNORE INTO wishlist (user_id, package_id) VALUES (?, ?)',
      [req.user.id, packageId]
    );

    res.json({ success: true, message: 'Added to wishlist!' });
  } catch (err) {
    console.error('addToWishlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist.' });
  }
};

// ─── DELETE /api/wishlist/:packageId ──────────────────────
const removeFromWishlist = async (req, res) => {
  try {
    const { packageId } = req.params;
    await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND package_id = ?',
      [req.user.id, packageId]
    );
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist.' });
  }
};

// ─── GET /api/wishlist/ids — returns just package IDs ─────
// Used by frontend on load to highlight hearts
const getWishlistIds = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT package_id FROM wishlist WHERE user_id = ?',
      [req.user.id]
    );
    const ids = rows.map(r => r.package_id);
    res.json({ success: true, ids });
  } catch (err) {
    console.error('getWishlistIds error:', err);
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, getWishlistIds };
