// routes/coupons.js
const express = require('express');
const router  = express.Router();
const { validateCoupon, listCoupons } = require('../controllers/couponsController');

// GET  /api/coupons          — list active coupons (for Postman testing)
router.get('/',     listCoupons);

// POST /api/coupons/validate — validate a coupon code
router.post('/validate', validateCoupon);

module.exports = router;
