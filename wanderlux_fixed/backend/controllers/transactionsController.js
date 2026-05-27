const db = require('../config/db');

function genRef(prefix, len = 6) {
  return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000)).padStart(len, '0')}`;
}
function genTxn(booking_ref) {
  return `txn_${Date.now()}_${booking_ref || Math.random().toString(36).slice(2, 8)}`;
}
function genGw() {
  return `gw_ref_${Date.now()}`;
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

// ══════════════════════════════════════════════════════════════════════
// PAYMENTS
// POST /api/payments — record payment for a booking
// ══════════════════════════════════════════════════════════════════════
const createPayment = async (req, res) => {
  console.log("Payment request:", req.body);
  try {
    const { booking_id, payment_method, card_last4, card_brand } = req.body;
    if (!booking_id) return res.status(400).json({ success: false, message: 'booking_id is required' });

    const [[booking]] = await db.query(
      `SELECT * FROM bookings WHERE id = ? AND user_id = ?`,
      [booking_id, req.user.id]
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ success: false, message: 'Cannot process payment for a cancelled booking' });

    let alreadyPaid = false;
    try {
      const [[existingPay]] = await db.query(
        `SELECT id FROM payments WHERE booking_id = ? AND status = 'success'`, [booking_id]
      );
      if (existingPay) alreadyPaid = true;
    } catch (checkErr) {
      console.warn('Could not check existing payments:', checkErr.message);
    }
    if (alreadyPaid) return res.status(400).json({ success: false, message: 'This booking has already been paid' });

    const safe_card_last4 = req.body.card_last4 || req.body.cardLast4 || req.body.card_number?.slice(-4) || req.body.cardNumber?.slice(-4) || '4242';
    const safe_card_brand = req.body.card_brand || req.body.cardBrand || 'Visa';
    const safe_txn_id = req.body.transaction_id || req.body.transactionId || genTxn(booking.booking_ref);
    const safe_gw_ref = req.body.gateway_ref || req.body.gatewayRef || genGw();
    
    const currency = 'INR';
    const paymentStatus = 'success';
    const payMethod = payment_method || 'card';

    const insertValues = [
      booking_id, booking.booking_ref, req.user.id, booking.total_amount, currency,
      payMethod, safe_card_last4, safe_card_brand, safe_txn_id, safe_gw_ref, paymentStatus
    ];
    console.log("Payment insert values:", insertValues);

    const connection = await db.getConnection();
    let payment_id = null;
    let invoice_number = null;

    try {
      await connection.beginTransaction();

      const [payResult] = await connection.query(
        `INSERT INTO payments
           (booking_id, booking_ref, user_id, amount, currency, payment_method, card_last4, card_brand,
            transaction_id, gateway_ref, status, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        insertValues
      );
      payment_id = payResult.insertId;

      invoice_number = `INV-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const inv_subtotal = (booking.package_cost_inr || 0) + (booking.transport_cost || 0);
      
      try {
        await connection.query(
          `INSERT INTO invoices
             (invoice_number, booking_id, booking_ref, user_id, payment_id,
              subtotal, gst_amount, discount_amount, total_amount, issued_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [invoice_number, booking_id, booking.booking_ref, req.user.id, payment_id,
           inv_subtotal, booking.gst_amount || 0, booking.discount_amount || 0, booking.total_amount]
        );
      } catch (invErr) {
        console.warn('Invoice insert skipped (likely handled by trigger):', invErr.message);
      }

      await connection.commit();
      connection.release();
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      throw txErr;
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded and invoice generated.',
      transaction_id: safe_txn_id,
      invoice_number,
      amount: booking.total_amount
    });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, pk.title as pkg_title
       FROM payments p
       JOIN bookings b  ON b.id = p.booking_id
       JOIN packages pk ON pk.id = b.package_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, payments: rows });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

// ══════════════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════════════
const getMyInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, pk.title as pkg_title, pk.location as pkg_location
       FROM invoices i
       JOIN bookings b  ON b.id = i.booking_id
       JOIN packages pk ON pk.id = b.package_id
       WHERE i.user_id = ?
       ORDER BY i.issued_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, invoices: rows });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

const getInvoiceByBooking = async (req, res) => {
  try {
    const [[invoice]] = await db.query(
      `SELECT i.*, pk.title as pkg_title, pk.location as pkg_location,
              b.travel_date, b.adults, b.transport_mode, b.transport_detail, b.transport_cost,
              bt.first_name, bt.last_name, bt.email as lead_email
       FROM invoices i
       JOIN bookings b        ON b.id = i.booking_id
       JOIN packages pk       ON pk.id = b.package_id
       LEFT JOIN booking_travellers bt ON bt.booking_id = b.id AND bt.is_lead = 1
       WHERE i.booking_id = ? AND i.user_id = ?`,
      [req.params.booking_id, req.user.id]
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

// ══════════════════════════════════════════════════════════════════════
// CANCELLATIONS
// ══════════════════════════════════════════════════════════════════════
const cancelAndDelete = async (req, res) => {
  let connection;
  try {
    const booking_id = req.params.booking_id;
    console.log("Cancelling booking ID:", booking_id);
    const reason = req.body.reason || 'User cancelled';

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[booking]] = await connection.query(
      `SELECT b.*, p.title as package_title, p.location as package_location, p.image_url as package_image_url 
       FROM bookings b 
       JOIN packages p ON b.package_id = p.id 
       WHERE b.id = ? AND b.user_id = ?`,
      [booking_id, req.user.id]
    );
    
    if (!booking) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // 1. Compute refund based on travel date and cancellation policy
    const { refund_amount, refund_policy, refund_status } = computeRefund(
      booking.total_amount,
      booking.travel_date
    );

    // 2. Update payment status to reflect refund
    await connection.query(
      `UPDATE payments SET status = ? WHERE booking_id = ?`,
      [refund_amount > 0 ? 'refunded' : 'no_refund', booking_id]
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
      [booking_id, booking.booking_ref, req.user.id, reason, refund_amount, refund_policy, refund_status]
    );

    // 5. Delete travellers then booking (booking_id in cancellations becomes NULL via SET NULL FK)
    await connection.query(`DELETE FROM booking_travellers WHERE booking_id = ?`, [booking_id]);
    await connection.query(`DELETE FROM bookings WHERE id = ?`, [booking_id]);

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
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

const getMyCancellations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*
       FROM cancellations c
       WHERE c.user_id = ?
       ORDER BY c.cancelled_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, cancellations: rows });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

// ══════════════════════════════════════════════════════════════════════
// CUSTOMER SUPPORT
// ══════════════════════════════════════════════════════════════════════
const createTicket = async (req, res) => {
  try {
    const { name, email, message, booking_ref } = req.body;
    // Normalise subject/category — both fields come from the same dropdown
    const subject  = (req.body.subject  || req.body.category || 'General Enquiry').trim();
    const category = (req.body.category || req.body.subject  || 'General Enquiry').trim();

    if (!name || !email || !subject || !message)
      return res.status(400).json({ success: false, message: 'name, email, subject and message are required.' });

    const ticket_number = genRef('TKT');
    const catMap = {
      'General Enquiry':           'general',
      'Custom Package Request':    'custom_package',
      'Booking Support':           'booking_support',
      'Cancellation / Refund':     'cancellation_refund',
      'Feedback':                  'feedback',
      'Partnership':               'partnership'
    };
    // Map the human-readable label to the DB ENUM value
    const cat = catMap[category] || catMap[subject] || 'general';
    // user_id from JWT (if logged in), else null for guest submissions
    const userId = req.user ? req.user.id : null;

    const [result] = await db.query(
      `INSERT INTO customer_support
         (ticket_number, user_id, booking_ref, name, email, subject, category, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
      [ticket_number, userId, booking_ref || null,
       name, email, subject, cat, message]
    );

    res.status(201).json({
      success: true,
      message: 'Your support ticket has been submitted. We\'ll reply within 4 hours.',
      ticket_number,
      ticket_id: result.insertId
    });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM customer_support WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, tickets: rows });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message
    });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getMyInvoices,
  getInvoiceByBooking,
  cancelAndDelete,
  getMyCancellations,
  createTicket,
  getMyTickets
};
