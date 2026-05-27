const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [destinations] = await db.query(
      `SELECT id, name, country, package_count AS count, image_url AS image
       FROM destinations ORDER BY name ASC`
    );
    res.json({ success: true, data: destinations, destinations });
  } catch (err) {
    console.error('destinations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch destinations.' });
  }
});

module.exports = router;