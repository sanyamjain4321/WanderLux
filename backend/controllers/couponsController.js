// ═══════════════════════════════════════════════════════════
// controllers/couponsController.js — Coupon Validation
// ═══════════════════════════════════════════════════════════

const db = require('../config/db');

// ─── POST /api/coupons/validate ───────────────────────────
const validateCoupon = async (req, res) => {
  try {
    const { code, order_amount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    // Query only columns that exist in schema.sql
    const [[coupon]] = await db.query(
      `SELECT id, code, type, value, min_order
       FROM coupons
       WHERE code = ? AND is_active = 1`,
      [code.toUpperCase().trim()]
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const amount = parseFloat(order_amount) || 0;

    if (amount < coupon.min_order) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum booking of ₹${Number(coupon.min_order).toLocaleString('en-IN')}.`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = amount * (coupon.value / 100);
    } else {
      // flat
      discount = coupon.value;
    }
    discount = Math.round(discount);

    res.json({
      success:         true,
      message:         `Coupon applied! You save ₹${discount.toLocaleString('en-IN')}`,
      coupon: {
        code:           coupon.code,
        discount_type:  coupon.type, // Map for frontend
        discount_value: coupon.value // Map for frontend
      },
      discount_amount: discount
    });

  } catch (err) {
    console.error('validateCoupon error:', err);
    res.status(500).json({ success: false, message: 'Coupon validation failed.' });
  }
};

// ─── GET /api/coupons — list active coupons (for testing) ─
const listCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query(
      `SELECT code, type as discount_type, value as discount_value, min_order as min_order_value
       FROM coupons WHERE is_active = 1
       ORDER BY value DESC`
    );
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
};

module.exports = { validateCoupon, listCoupons };
