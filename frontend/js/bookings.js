// ═══════════════════════════════════════════════════════════
// frontend/js/bookings.js — Booking & Trips Logic
// ═══════════════════════════════════════════════════════════

let _cancelBookingId = null;

window.renderTrips = async function() {
  const container = document.getElementById('trips-container');
  const countEl   = document.getElementById('trips-count');
  if (!container) return;

  if (!WL.isLoggedIn()) {
    container.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;">
        <p style="color:var(--warm-grey);margin-bottom:1.5rem;">Sign in to view your trips</p>
        <button class="btn-book" onclick="openModal()">Sign In</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--warm-grey);">Loading trips…</div>`;

  try {
    const { bookings } = await WL.getMyTrips();
    if (countEl) countEl.textContent = `${bookings.length} trip${bookings.length !== 1 ? 's' : ''}`;

    if (!bookings.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;background:var(--white);border-radius:12px;">
          <p style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;">No trips yet</p>
          <p style="color:var(--warm-grey);margin:1rem 0 1.5rem;">Your confirmed bookings will appear here</p>
          <button class="btn-book" onclick="showPage('packages')">Explore Packages →</button>
        </div>`;
      return;
    }

    container.innerHTML = bookings.map(b => {
      const statusColors = { confirmed:'#22c55e', pending:'#f59e0b', cancelled:'#ef4444', completed:'#3b82f6', refunded:'#8b5cf6' };
      const color = statusColors[b.booking_status] || '#888';
      const depDate = new Date(b.departure_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
      const inrAmt  = Number(b.total_amount).toLocaleString('en-IN');

      // Build transport badge if present
      const txIcons = { flight: '✈️', train: '🚆', cab: '🚗' };
      const txBadge = (b.transport_mode && b.transport_mode !== 'none' && b.transport_detail)
        ? `<div style="font-size:0.78rem;color:var(--forest);background:rgba(74,111,82,0.08);padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:0.5rem;">
             ${txIcons[b.transport_mode] || '🚌'} ${b.transport_detail}
           </div>`
        : '';

      return `
      <div class="trip-card" style="background:var(--white);border-radius:12px;overflow:hidden;box-shadow:var(--card-shadow);display:grid;grid-template-columns:220px 1fr;margin-bottom:1.5rem;">
        <div style="position:relative;min-height:160px;">
          <img src="${b.pkg_image}?w=440&q=75&fit=crop&auto=format" alt="${b.pkg_title}"
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.src='https://images.unsplash.com/photo-1488085061387-422e29b40080?w=440&q=75&fit=crop'">
        </div>
        <div style="padding:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;">${b.pkg_title}</div>
            <span style="background:${color}22;color:${color};padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;text-transform:capitalize;">${b.booking_status}</span>
          </div>
          <div style="color:var(--warm-grey);font-size:0.85rem;margin-bottom:0.5rem;">📍 ${b.pkg_location} &nbsp;·&nbsp; 📅 ${depDate} &nbsp;·&nbsp; 👥 ${b.adults} adult${b.adults > 1 ? 's' : ''}</div>
          ${txBadge}
          <div style="font-size:0.8rem;color:var(--warm-grey);margin-bottom:0.25rem;">Ref: <strong style="color:var(--ink);font-family:monospace;">${b.booking_ref}</strong></div>
          <div style="font-size:1rem;font-weight:700;color:var(--terra);margin:0.75rem 0;">₹${inrAmt}</div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            ${b.booking_status === 'confirmed' || b.booking_status === 'pending' ? `
              <button class="btn-book" style="padding:8px 18px;font-size:0.8rem;"
                onclick="openCancelModal(${b.booking_id}, '${b.pkg_title}', '${b.booking_ref}')">
                Cancel Booking
              </button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="color:var(--terra);padding:2rem;">${err.message}</div>`;
  }
};

window.openCancelModal = function(bookingId, tripName, ref) {
  _cancelBookingId = bookingId;
  document.getElementById('cm-trip-name').textContent = tripName;
  document.getElementById('cm-ref-pill').textContent  = ref;
  document.getElementById('cancel-confirm-modal').style.display = 'flex';
};

window.confirmCancellation = async function() {
  if (!_cancelBookingId) return;
  const btn = document.querySelector('.btn-cm-cancel');
  if (btn) { btn.textContent = 'Cancelling…'; btn.disabled = true; }

  try {
    // cancelAndDelete: records cancellation, marks payment refunded, updates booking status
    const res = await WL.cancelAndDelete(_cancelBookingId, 'Cancelled by user');
    closeCancelModal();
    const ref = res.booking_ref || `#${_cancelBookingId}`;
    const refundMsg = res.refund_amount > 0
      ? `Refund of ₹${Number(res.refund_amount).toLocaleString('en-IN')} will be processed per policy.`
      : 'No refund applicable per cancellation policy.';
    showToast(`Booking ${ref} cancelled. ${refundMsg}`);
    _cancelBookingId = null;
    renderTrips(); // refresh — booking will no longer appear
  } catch (err) {
    showToast(err.message || 'Cancellation failed', 'error');
  } finally {
    if (btn) { btn.textContent = 'Yes, Cancel Booking'; btn.disabled = false; }
  }
};

window.confirmBooking = async function() {
  if (!WL.isLoggedIn()) { openModal(); showToast('Please sign in to book'); return; }

  const pkg = currentPackage;
  if (!pkg) return;

  const dateVal  = document.getElementById('bk-date')?.value;
  const adultsEl = document.getElementById('bk-adults') || document.getElementById('bk-adults-count') || document.getElementById('td-pax-num');
  const adults   = parseInt(adultsEl?.value || adultsEl?.textContent || '2');
  const couponEl = document.getElementById('coupon-input') || document.getElementById('bk-coupon');
  const coupon   = couponEl?.value?.trim();

  // Read transport selection from main.js scope
  const tx = (typeof selectedTransport !== 'undefined') ? selectedTransport : null;

  // Build transport fields for the API
  let transport_mode   = 'none';
  let transport_detail = null;
  let transport_price  = 0;

  if (tx) {
    transport_mode = tx.mode; // 'flight' | 'train' | 'cab'
    transport_price = Math.round((tx.trainClassPrice || tx.price || 0));

    if (tx.mode === 'flight') {
      transport_detail = `${tx.airline || tx.provider} ${tx.code} · ${tx.cls || 'Economy'} · Departs ${tx.departs}`;
    } else if (tx.mode === 'train') {
      transport_detail = `${tx.name || tx.provider} #${tx.number || tx.code}${tx.trainClass ? ' · ' + tx.trainClass : ''} · Departs ${tx.departs}`;
    } else if (tx.mode === 'cab') {
      transport_detail = `${tx.type || tx.provider} · ${tx.models || tx.code}${tx.tier ? ' · ' + tx.tier : ''}`;
    }
  }

  // Lead traveller info from form (IDs are tv1-fname, tv1-lname, tv1-email, tv1-phone)
  const leadFNameEl = document.getElementById('tv1-fname');
  const leadLNameEl = document.getElementById('tv1-lname');
  const lead_name   = leadFNameEl
    ? `${leadFNameEl.value || ''} ${leadLNameEl?.value || ''}`.trim()
    : `${WL.getUser()?.first_name || ''} ${WL.getUser()?.last_name || ''}`.trim();
  const lead_email = document.getElementById('tv1-email')?.value || WL.getUser()?.email || null;
  const lead_phone = document.getElementById('tv1-phone')?.value || null;

  const travellers = [];
  // Collect all travellers from tv{i}-fname / tv{i}-lname pattern
  let i = 1;
  while (document.getElementById(`tv${i}-fname`)) {
    travellers.push({
      first_name: document.getElementById(`tv${i}-fname`)?.value || `Traveller ${i}`,
      last_name:  document.getElementById(`tv${i}-lname`)?.value || '',
      gender:     document.getElementById(`tv${i}-gender`)?.value || null
    });
    i++;
  }
  // Fallback: also check legacy trav-fname-N pattern
  if (!travellers.length) {
    document.querySelectorAll('[id^="trav-fname-"]').forEach((el, idx) => {
      travellers.push({
        first_name: el.value || `Traveller ${idx+1}`,
        last_name:  document.getElementById(`trav-lname-${idx+1}`)?.value || '',
        gender:     document.getElementById(`trav-gender-${idx+1}`)?.value || null
      });
    });
  }

  const btn = document.querySelector('.btn-confirm-booking, [onclick*="confirmBooking"]');
  if (btn) { btn.textContent = 'Booking…'; btn.disabled = true; }

  try {
    const res = await WL.createBooking({
      pkg_id:           pkg.id,
      adults,
      departure_date:   dateVal,
      coupon_code:      coupon || undefined,
      travellers:       travellers.length ? travellers : [{ first_name: WL.getUser()?.first_name || 'Guest', last_name: WL.getUser()?.last_name || '' }],
      transport_mode,
      transport_detail,
      transport_price,
      lead_name,
      lead_email,
      lead_phone
    });

    showToast(`✓ Booking confirmed! Ref: ${res.booking_ref}`);
    // Show success panel and set booking ref
    if (typeof nextStep === 'function') nextStep(5);
    const successEl = document.getElementById('booking-success');
    if (successEl) successEl.style.display = 'block';
    const refEl = document.getElementById('booking-ref');
    if (refEl) refEl.textContent = res.booking_ref;
    // Reset transport selection
    if (typeof selectedTransport !== 'undefined') window.selectedTransport = null;
    setTimeout(() => { if (typeof showPage === 'function') showPage('trips'); }, 3000);

  } catch (err) {
    showToast(err.message || 'Booking failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Confirm Booking'; btn.disabled = false; }
  }
};

window.applyCoupon = async function() {
  const input = document.getElementById('coupon-input') || document.getElementById('bk-coupon');
  if (!input?.value.trim()) { showToast('Enter a coupon code', 'error'); return; }

  const pkg     = currentPackage;
  const adults  = parseInt(document.getElementById('td-pax-num')?.textContent || '2');
  const amount  = pkg ? pkg.price * adults * 83 : 0;

  try {
    const res = await WL.validateCoupon(input.value.trim(), amount);
    showToast(res.message);
    const discountEl = document.getElementById('bk-discount') || document.getElementById('booking-discount');
    if (discountEl) discountEl.textContent = `−₹${res.discount_amount.toLocaleString('en-IN')}`;
  } catch (err) {
    showToast(err.message || 'Invalid coupon', 'error');
  }
};
