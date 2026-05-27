// controllers/reviewsController.js — Reviews
const db = require('../config/db');

const ensureReviewsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      package_id  INT,
      rating      INT NOT NULL DEFAULT 5,
      title       VARCHAR(200),
      body        TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
    )
  `);
};

const getReviews = async (req, res) => {
  try {
    await ensureReviewsTable();
    const { packageId } = req.query;
    let sql = `SELECT r.id, r.rating, r.title, r.body, r.created_at,
                      u.name AS author_name, p.title AS trip_name
               FROM reviews r
               JOIN users u    ON u.id = r.user_id
               LEFT JOIN packages p ON p.id = r.package_id`;
    const params = [];
    if (packageId) { sql += ' WHERE r.package_id = ?'; params.push(packageId); }
    sql += ' ORDER BY r.created_at DESC LIMIT 50';
    const [userReviews] = await db.query(sql, params);

    let testimonials = [];
    if (!packageId) {
      const [rows] = await db.query(
        `SELECT id, author_name, trip_name, review_text AS body, rating, avatar_url FROM testimonials ORDER BY id LIMIT 20`
      );
      testimonials = rows.map(t => ({ ...t, source: 'testimonial' }));
    }
    res.json({ success: true, reviews: [...userReviews, ...testimonials] });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

const createReview = async (req, res) => {
  console.log("Review request:", req.body);
  try {
    await ensureReviewsTable();
    const { package_id, rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }
    const [result] = await db.query(
      `INSERT INTO reviews (user_id, package_id, rating, title, body, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.user.id, package_id || null, rating, title || null, body || null]
    );

    // The trigger trg_update_package_rating has already updated packages.rating.
    // Read back the fresh rating so the frontend can update the UI immediately.
    let liveRating = null, liveReviewCount = null;
    if (package_id) {
      const [[pkg]] = await db.query(
        `SELECT rating, reviews FROM packages WHERE id = ?`, [package_id]
      );
      liveRating      = pkg?.rating      ?? null;
      liveReviewCount = pkg?.reviews     ?? null;
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review_id:    result.insertId,
      live_rating:  liveRating,        
      live_reviews: liveReviewCount
    });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

module.exports = { getReviews, createReview };
