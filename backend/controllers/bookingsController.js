const db = require('../config/db');

function genRef(prefix = 'WDL') {
  return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

// ─── Compute refund details based on days until travel ────────────────────────
function computeRefund(total_amount, travel_date) {
  const now = new Date();
  const travel = new Date(travel_date);
  const daysUntilTravel = Math.ceil((travel - now) / (1000 * 60 * 60 * 24));

  let refund_pct = 0;
  let refund_policy = '';
  let refund_status = 'no_refund';

  if (daysUntilTravel > 30) {
    refund_pct = 90;
    refund_policy = '90% refund — cancelled more than 30 days before travel';
    refund_status = 'pending';
  } else if (daysUntilTravel > 15) {
    refund_pct = 50;
    refund_policy = '50% refund — cancelled 15–30 days before travel';
    refund_status = 'pending';
  } else if (daysUntilTravel > 7) {
    refund_pct = 25;
    refund_policy = '25% refund — cancelled 7–15 days before travel';
    refund_status = 'pending';
  } else {
    refund_pct = 0;
    refund_policy = 'No refund — cancelled within 7 days of travel';
    refund_status = 'no_refund';
  }

  const refund_amount = Math.round((total_amount * refund_pct) / 100);
  return { refund_amount, refund_policy, refund_status };
}

const createBooking = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { adults, departure_date, coupon_code, travellers, transport_mode, transport_detail, transport_price, package_cost_inr, gst_amount, discount_amount, total_amount, payment_method, lead_name, lead_email, lead_phone } = req.body;
    
    const user_id = req.user?.id;
    const package_id = req.body.packageId || req.body.package_id || req.body.pkg_id;

    console.log("Booking request:", req.body);
    console.log("User ID:", user_id);
    console.log("Package ID:", package_id);

    if (!user_id || !package_id) {
      return res.status(400).json({ success: false, message: 'Missing user ID or package ID' });
    }

    const [[user]] = await connection.query(`SELECT id FROM users WHERE id = ?`, [user_id]);
    if (!user) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    const [[pkg]] = await connection.query(`SELECT id, price_usd FROM packages WHERE id = ?`, [package_id]);
    if (!pkg) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Package not found in database' });
    }

    const pax = Number(adults) || 1;
    const safe_trans = Number(transport_price) || 0;
    
    let safe_package_cost = Number(package_cost_inr);
    if (!safe_package_cost) safe_package_cost = Math.round((pkg.price_usd || 0) * pax * 83); 
    
    let safe_gst = Number(gst_amount);
    if (!safe_gst) safe_gst = Math.round(safe_package_cost * 0.18);
    
    const safe_discount = Number(discount_amount) || 0;
    
    let safe_total = Number(total_amount);
    if (!safe_total) safe_total = safe_package_cost + safe_gst + safe_trans - safe_discount;

    const booking_ref = genRef('WDL');
    const year = new Date().getFullYear();
    const invoice_number = `INV-${year}-${String(Math.floor(100000 + Math.random() * 900000))}`;

    await connection.beginTransaction();

    // 1. Insert Booking
    const [bookRes] = await connection.query(
      `INSERT INTO bookings (booking_ref, user_id, package_id, travel_date, adults, transport_mode, transport_detail, transport_cost, package_cost_inr, gst_amount, discount_amount, coupon_code, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [booking_ref, user_id, package_id, departure_date, pax, transport_mode || 'none', transport_detail || null, safe_trans, safe_package_cost, safe_gst, safe_discount, coupon_code || null, safe_total]
    );
    const booking_id = bookRes.insertId;

    // 2. Insert Travellers
    let leadFirstName = lead_name || 'Guest';
    let leadLastName = '';
    if (lead_name && lead_name.includes(' ')) {
       const parts = lead_name.split(' ');
       leadFirstName = parts[0];
       leadLastName = parts.slice(1).join(' ');
    }

    await connection.query(
      `INSERT INTO booking_travellers (booking_id, is_lead, first_name, last_name, email, phone) VALUES (?, 1, ?, ?, ?, ?)`,
      [booking_id, leadFirstName, leadLastName, lead_email || null, lead_phone || null]
    );

    if (travellers && travellers.length > 0) {
      for (let i = 0; i < travellers.length; i++) {
        await connection.query(
          `INSERT INTO booking_travellers (booking_id, is_lead, first_name, last_name, email, phone) VALUES (?, 0, ?, ?, ?, ?)`,
          [booking_id, travellers[i].first_name || '', travellers[i].last_name || '', travellers[i].email || null, travellers[i].phone || null]
        );
      }
    }

    // 3. Insert Payment
    const safe_card_last4 = req.body.card_last4 || req.body.cardLast4 || req.body.card_number?.slice(-4) || req.body.cardNumber?.slice(-4) || '4242';
    const safe_card_brand = req.body.card_brand || req.body.cardBrand || 'Visa';
    const safe_txn_id = req.body.transaction_id || req.body.transactionId || `txn_${Date.now()}_${booking_ref}`;
    const safe_gw_ref = req.body.gateway_ref || req.body.gatewayRef || `gw_ref_${Date.now()}_${booking_ref}`;

    const [payRes] = await connection.query(
      `INSERT INTO payments (booking_id, booking_ref, user_id, amount, payment_method, card_last4, card_brand, transaction_id, gateway_ref, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', NOW())`,
      [booking_id, booking_ref, user_id, safe_total, payment_method || 'card', safe_card_last4, safe_card_brand, safe_txn_id, safe_gw_ref]
    );
    const payment_id = payRes.insertId;

    // 4. Insert Invoice — always insert explicitly; if trigger already created one, skip gracefully
    const [existingInv] = await connection.query(
      `SELECT id FROM invoices WHERE booking_id = ?`, [booking_id]
    );
    if (existingInv.length === 0) {
      await connection.query(
        `INSERT INTO invoices (invoice_number, booking_id, booking_ref, user_id, payment_id, subtotal, gst_amount, discount_amount, total_amount, issued_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [invoice_number, booking_id, booking_ref, user_id, payment_id, safe_package_cost + safe_trans, safe_gst, safe_discount, safe_total]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ success: true, message: 'Booking completed successfully', booking_ref, booking_id });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("FULL ERROR:", err);
    return res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
const cancelBooking = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const reason = req.body.reason || 'User cancelled';

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Fetch full booking with package details
    const [[booking]] = await connection.query(
      `SELECT b.*, p.title AS package_title, p.location AS package_location, p.image_url AS package_image_url
       FROM bookings b
       JOIN packages p ON b.package_id = p.id
       WHERE b.id = ? AND b.user_id = ?`,
      [id, user_id]
    );

    if (!booking) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // 2. Compute refund amount and policy based on travel date
    const { refund_amount, refund_policy, refund_status } = computeRefund(
      booking.total_amount,
      booking.travel_date
    );

    // 3. Update payment to reflect refund status
    await connection.query(
      `UPDATE payments SET status = ? WHERE booking_id = ?`,
      [refund_amount > 0 ? 'refunded' : 'failed', id]
    );

    // 4. Insert cancellation record — ALL columns populated, no NULLs
    await connection.query(
      `INSERT INTO cancellations
         (booking_id, booking_ref, user_id, reason, refund_amount, refund_policy, refund_status, cancelled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         reason        = VALUES(reason),
         refund_amount = VALUES(refund_amount),
         refund_policy = VALUES(refund_policy),
         refund_status = VALUES(refund_status),
         cancelled_at  = VALUES(cancelled_at)`,
      [id, booking.booking_ref, user_id, reason, refund_amount, refund_policy, refund_status]
    );

    // 5. Delete travellers then booking (booking_id in cancellations becomes NULL via SET NULL FK)
    await connection.query(`DELETE FROM booking_travellers WHERE booking_id = ?`, [id]);
    await connection.query(`DELETE FROM bookings WHERE id = ?`, [id]);

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Booking successfully cancelled.',
      booking_ref: booking.booking_ref,
      refund_amount,
      refund_policy,
      refund_status
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("FULL ERROR:", err);
    return res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

// ─── GET /api/bookings/my-trips ───────────────────────────
const getMyTrips = async (req, res) => {
  try {
    // FIX: removed duplicate req.user.id param — only one ? placeholder exists
    const [bookings] = await db.query(
      `SELECT b.id as booking_id, b.booking_ref, b.adults, b.travel_date as departure_date,
              b.package_cost_inr as base_amount, b.gst_amount as tax_amount, b.discount_amount,
              b.transport_mode, b.transport_detail, b.transport_cost as transport_price,
              b.total_amount, b.status as booking_status, b.booked_at as created_at,
              t.first_name as lead_name, t.email as lead_email, t.phone as lead_phone,
              p.id as pkg_id, p.title AS pkg_title, p.image_url AS pkg_image,
              p.location AS pkg_location, p.duration AS pkg_duration,
              p.price_usd AS pkg_price
       FROM bookings b
       JOIN packages p ON b.package_id = p.id
       LEFT JOIN booking_travellers t ON t.booking_id = b.id AND t.is_lead = 1
       WHERE b.user_id = ?
       ORDER BY b.booked_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, bookings });
  } catch (err) {
    console.error('FULL ERROR:', err);
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

// ─── GET /api/bookings/:id ────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const [[booking]] = await db.query(
      `SELECT b.id as booking_id, b.*, p.title AS pkg_title, p.image_url AS pkg_image,
              p.location AS pkg_location, p.duration AS pkg_duration, p.price_usd AS pkg_price
       FROM bookings b JOIN packages p ON b.package_id = p.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (booking) {
      const [travellers] = await db.query(
        `SELECT * FROM booking_travellers WHERE booking_id = ?`, [booking.booking_id]
      );
      booking.travellers = travellers;
      return res.json({ success: true, booking });
    }

    // FIX: fallback queries only columns that exist in cancellations table,
    // JOINs bookings + packages to get package info
    const [[cancelled]] = await db.query(
      `SELECT
         c.booking_id,
         c.booking_ref,
         c.user_id,
         c.reason,
         c.refund_amount,
         c.refund_policy,
         c.refund_status,
         c.cancelled_at,
         b.travel_date,
         b.adults,
         b.total_amount,
         b.status,
         p.title       AS pkg_title,
         p.location    AS pkg_location,
         p.image_url   AS pkg_image,
         p.duration    AS pkg_duration,
         p.price_usd   AS pkg_price
       FROM cancellations c
       JOIN bookings b  ON b.id = c.booking_id
       JOIN packages p  ON p.id = b.package_id
       WHERE c.booking_id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (cancelled) {
      cancelled.travellers = [];
      return res.json({ success: true, booking: cancelled });
    }

    return res.status(404).json({ success: false, message: 'Booking not found' });

  } catch (err) {
    console.error('FULL ERROR:', err);
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

module.exports = { createBooking, getMyTrips, getBookingById, cancelBooking };
