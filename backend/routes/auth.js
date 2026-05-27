// routes/auth.js
const express = require('express');
const router  = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET  /api/auth/me  (protected)
router.get('/me', protect, getMe);

// PUT /api/auth/me (protected)
router.put('/me', protect, updateProfile);

module.exports = router;
