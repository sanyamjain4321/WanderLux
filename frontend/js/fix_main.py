import re

file_path = r"c:\Users\sanya\Downloads\wanderlux-fixed-final\wanderlux\frontend\js\main.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find where to replace
marker = "//   COUPON / DISCOUNT SYSTEM"
if marker in content:
    index = content.find(marker)
    content = content[:index]

missing_code = """// ═══════════════════════════════════════
//   COUPON / DISCOUNT SYSTEM
// ═══════════════════════════════════════
const COUPONS = {
  'WANDER10':  { type: 'percent', value: 10, desc: '10% off applied!' },
  'LUXURY500': { type: 'flat',    value: 500, minOrder: 50000, desc: '₹500 off applied!' },
  'MONSOON15': { type: 'percent', value: 15, desc: '15% off applied!' }
};
let appliedCoupon = null;

function useCoupon(code) {
  document.getElementById('coupon-input').value = code;
  if (typeof window.applyCoupon === 'function') {
    window.applyCoupon();
  } else {
    applyCoupon();
  }
}

function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  const msgEl = document.getElementById('coupon-msg');
  const coupon = COUPONS[code];
  if (!coupon) {
    appliedCoupon = null;
    if(msgEl) {
      msgEl.style.display = 'block';
      msgEl.innerHTML = '<span style="color:var(--terra);">✗ Invalid coupon code.</span>';
    }
    populateBookingSummaryWithDiscount();
    return;
  }
  const total = getBookingTotal();
  if (coupon.minOrder && total < coupon.minOrder) {
    appliedCoupon = null;
    if(msgEl) {
      msgEl.style.display = 'block';
      msgEl.innerHTML = '<span style="color:var(--terra);">✗ Minimum booking of ₹'+coupon.minOrder.toLocaleString()+' required.</span>';
    }
    populateBookingSummaryWithDiscount();
    return;
  }
  appliedCoupon = { code, ...coupon };
  if(msgEl) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = '<span style="color:var(--forest);">✓ ' + coupon.desc + '</span>';
  }
  populateBookingSummaryWithDiscount();
}

function getBookingTotal() {
  if (!currentPackage) return 0;
  const pax = getBookingPax();
  const pkgBase = Math.round(currentPackage.price * pax * 83);
  const txCost  = selectedTransport ? Math.round((selectedTransport.trainClassPrice || selectedTransport.price || 0) * pax) : 0;
  const tax = Math.round(pkgBase * 0.18);
  return pkgBase + txCost + tax;
}

function getDiscount(total) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === 'percent') return Math.round(total * appliedCoupon.value / 100);
  if (appliedCoupon.type === 'flat') return appliedCoupon.value;
  return 0;
}

function populateBookingSummaryWithDiscount() {
  populateBookingSummary();
}

// ═══════════════════════════════════════
//   TRAVELLER DETAIL FORMS
// ═══════════════════════════════════════
function renderTravellerForms() {
  const adults = parseInt(document.getElementById('bk-adults')?.value) || 2;
  const container = document.getElementById('traveller-forms-container');
  if (!container) return;
  const _cu = typeof WL !== 'undefined' ? WL.getUser() : null;
  let html = '';
  for (let i = 1; i <= adults; i++) {
    const isLead = i === 1;
    html += `
    <div class="traveller-card" id="traveller-card-${i}">
      <h4>
        <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:${isLead?'var(--terra)':'var(--forest)'};color:white;border-radius:50%;font-size:0.8rem;font-weight:700;">${i}</span>
        Traveller ${i}${isLead?' <span style="font-size:0.7rem;font-weight:500;color:var(--terra);background:rgba(196,98,45,0.1);padding:2px 10px;border-radius:100px;margin-left:6px;">(Lead)</span>':''}
      </h4>
      <div class="booking-grid">
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" id="tv${i}-fname" placeholder="First name" required>
          <span class="field-error-msg" id="tv${i}-fname-err" style="display:none;">Please enter first name</span>
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" id="tv${i}-lname" placeholder="Last name" required>
          <span class="field-error-msg" id="tv${i}-lname-err" style="display:none;">Please enter last name</span>
        </div>
        ${isLead ? `
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="tv${i}-email" placeholder="email@example.com" value="${_cu?.email||''}">
          <span class="field-error-msg" id="tv${i}-email-err" style="display:none;">Please enter a valid email</span>
        </div>
        <div class="form-group">
          <label>Phone *</label>
          <input type="tel" id="tv${i}-phone" placeholder="+91 98765 43210">
          <span class="field-error-msg" id="tv${i}-phone-err" style="display:none;">Please enter phone number</span>
        </div>` : `
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="tv${i}-dob">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="tv${i}-gender">
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>`}
        <div class="form-group">
          <label>Passport / ID Number</label>
          <input type="text" id="tv${i}-passport" placeholder="${isLead?'Z1234567':'Optional'}">
        </div>
        <div class="form-group">
          <label>Nationality</label>
          <select id="tv${i}-nationality">
            <option>Indian</option><option>British</option><option>American</option><option>Australian</option><option>Other</option>
          </select>
        </div>
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

function validateAndNextStep(step) {
  const adults = parseInt(document.getElementById('bk-adults')?.value) || 2;
  let valid = true;
  
  for (let i = 1; i <= adults; i++) {
    const fname = document.getElementById('tv'+i+'-fname');
    const lname = document.getElementById('tv'+i+'-lname');
    
    if (!fname || !fname.value.trim()) {
      if (fname) fname.classList.add('field-error');
      const err = document.getElementById('tv'+i+'-fname-err');
      if (err) err.style.display = 'block';
      valid = false;
    } else {
      if (fname) fname.classList.remove('field-error');
      const err = document.getElementById('tv'+i+'-fname-err');
      if (err) err.style.display = 'none';
    }
    
    if (!lname || !lname.value.trim()) {
      if (lname) lname.classList.add('field-error');
      const err = document.getElementById('tv'+i+'-lname-err');
      if (err) err.style.display = 'block';
      valid = false;
    } else {
      if (lname) lname.classList.remove('field-error');
      const err = document.getElementById('tv'+i+'-lname-err');
      if (err) err.style.display = 'none';
    }
    
    // Lead traveller additional fields
    if (i === 1) {
      const email = document.getElementById('tv1-email');
      const phone = document.getElementById('tv1-phone');
      if (!email || !email.value.trim() || !email.value.includes('@')) {
        if (email) email.classList.add('field-error');
        const err = document.getElementById('tv1-email-err');
        if (err) err.style.display = 'block';
        valid = false;
      } else {
        if (email) email.classList.remove('field-error');
        const err = document.getElementById('tv1-email-err');
        if (err) err.style.display = 'none';
      }
      if (!phone || !phone.value.trim()) {
        if (phone) phone.classList.add('field-error');
        const err = document.getElementById('tv1-phone-err');
        if (err) err.style.display = 'block';
        valid = false;
      } else {
        if (phone) phone.classList.remove('field-error');
        const err = document.getElementById('tv1-phone-err');
        if (err) err.style.display = 'none';
      }
    }
  }
  
  if (!valid) {
    showToast('Please fill in all traveller details to continue', 'error');
    const firstErr = document.querySelector('.field-error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  
  // Copy lead traveller info to legacy fields
  const tv1fname = document.getElementById('tv1-fname')?.value || '';
  const tv1lname = document.getElementById('tv1-lname')?.value || '';
  const tv1email = document.getElementById('tv1-email')?.value || '';
  const tv1phone = document.getElementById('tv1-phone')?.value || '';
  if (document.getElementById('bk-fname')) document.getElementById('bk-fname').value = tv1fname;
  if (document.getElementById('bk-lname')) document.getElementById('bk-lname').value = tv1lname;
  if (document.getElementById('bk-email')) document.getElementById('bk-email').value = tv1email;
  if (document.getElementById('bk-phone')) document.getElementById('bk-phone').value = tv1phone;
  
  nextStep(step);
}

function validateDetailsAndNext() {
  const fname = document.getElementById('bk-fname');
  const lname = document.getElementById('bk-lname');
  const email = document.getElementById('bk-email');
  const phone = document.getElementById('bk-phone');
  
  let valid = true;
  [fname, lname, email, phone].forEach(f => {
    if (f && !f.value.trim()) {
      f.style.borderColor = 'var(--terra)';
      f.style.background = '#fff5f3';
      valid = false;
    } else if (f) {
      f.style.borderColor = '';
      f.style.background = '';
    }
  });
  
  if (!valid) {
    showToast('Please fill in all required details', 'error');
    return;
  }
  
  appliedCoupon = null; // reset coupon when entering payment
  nextStep(4);
}

function validatePaymentAndConfirm() {
  const cardName = document.querySelector('#panel-4 input[placeholder="PRIYA SHARMA"]');
  const cardNum = document.querySelector('#panel-4 input[placeholder="4242 4242 4242 4242"]');
  const expiry = document.querySelector('#panel-4 input[placeholder="MM/YY"]');
  const cvv = document.querySelector('#panel-4 input[placeholder="•••"]');
  
  let valid = true;
  [cardName, cardNum, expiry, cvv].forEach(f => {
    if (f && !f.value.trim()) {
      f.style.borderColor = 'var(--terra)';
      f.style.background = '#fff5f3';
      valid = false;
    } else if (f) {
      f.style.borderColor = '';
      f.style.background = '';
    }
  });
  
  if (!valid) {
    showToast('Please fill in all payment details', 'error');
    return;
  }
  
  if (typeof window.confirmBooking === 'function') {
    window.confirmBooking();
  } else {
    addToMyTrips();
  }
}

// Fallback logic if bookings.js doesn't provide confirmBooking
function addToMyTrips() {
  if (!currentPackage) return;
  const pkg = currentPackage;
  const date = document.getElementById('bk-date').value;
  const ref = 'WDL-' + Math.floor(100000 + Math.random()*900000);
  document.getElementById('booking-ref').textContent = ref;
  const pax = getBookingPax();
  const pkgBase = Math.round(pkg.price * pax * 83);
  const txCost  = selectedTransport ? Math.round((selectedTransport.trainClassPrice || selectedTransport.price || 0) * pax) : 0;
  const tax     = Math.round(pkgBase * 0.18);
  const subtotalAmt = pkgBase + txCost + tax;
  const discountAmt = getDiscount(subtotalAmt);
  const total   = subtotalAmt - discountAmt;
  myTrips.unshift({
    pkg, date, ref,
    adults: pax,
    status: 'confirmed',
    total,
    transport: selectedTransport ? { ...selectedTransport } : null,
    bookedAt: new Date()
  });
  selectedTransport = null;
  if (typeof window.renderTrips === 'function') window.renderTrips();
  showToast('✓ Booking confirmed! Ref: ' + ref);
  nextStep(5);
}

// ═══════════════════════════════════════
//   BOOKING DETAIL MODAL
// ═══════════════════════════════════════
let _detailTrip = null;

function openBookingDetail(ref) {
  const fetchAndShow = async () => {
    try {
      let t = myTrips.find(x => x.ref === ref || x.booking_ref === ref);
      if (!t && typeof WL !== 'undefined') {
        const { bookings } = await WL.getMyTrips();
        const apiTrip = bookings.find(b => b.booking_ref === ref);
        if (apiTrip) {
          t = {
            ref: apiTrip.booking_ref,
            status: apiTrip.booking_status,
            date: apiTrip.departure_date,
            adults: apiTrip.adults,
            total: apiTrip.total_amount,
            bookedAt: apiTrip.created_at,
            pkg: {
              title: apiTrip.package_title,
              image: apiTrip.package_image,
              location: apiTrip.package_location,
              duration: apiTrip.package_duration,
              price: 0
            }
          };
        }
      }
      if (!t) return;
      _detailTrip = t;
      
      const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      const setImg = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };
      
      setImg('bd-pkg-img', t.pkg.image || '');
      setEl('bd-pkg-title', t.pkg.title);
      setEl('bd-pkg-loc', t.pkg.location);
      setEl('bd-ref', t.ref);
      
      const pill = document.getElementById('bd-status-pill');
      if (pill) {
        pill.textContent = t.status.charAt(0).toUpperCase() + t.status.slice(1);
        pill.style.cssText = t.status === 'confirmed'
          ? 'background:#e8f5e9;color:#2d7a2d;'
          : t.status === 'cancelled'
          ? 'background:#fff0ed;color:#c4622d;'
          : 'background:#e3f2fd;color:#1455a0;';
      }
        
      setEl('bd-date', t.date ? new Date(t.date).toLocaleDateString() : 'TBC');
      setEl('bd-duration', t.pkg.duration);
      setEl('bd-booked-on', t.bookedAt ? new Date(t.bookedAt).toLocaleString() : 'N/A');
      setEl('bd-pax', (t.adults || 2) + ' adult(s)');
      
      const _cu = typeof WL !== 'undefined' ? WL.getUser() : null;
      setEl('bd-lead-name', (t.leadName) || (_cu?.first_name) || '—');
      setEl('bd-lead-email', (t.leadEmail) || (_cu?.email) || '—');
      setEl('bd-lead-phone', t.leadPhone || '—');
      setEl('bd-adults', (t.adults || 2) + ' adults');
      
      const txSec = document.getElementById('bd-transport-section');
      if (txSec) {
        if (t.transport) {
          txSec.style.display = '';
          const mode = t.transport.mode;
          setEl('bd-tx-mode', mode.charAt(0).toUpperCase() + mode.slice(1));
          const detail = mode === 'flight'
            ? `${t.transport.airline} ${t.transport.code} · ${t.transport.cls || 'Economy'} class · Departs ${t.transport.departs}`
            : mode === 'train'
            ? `${t.transport.name} #${t.transport.number}${t.transport.trainClass ? ' · ' + t.transport.trainClass : ''} · Departs ${t.transport.departs}`
            : `${t.transport.type} · ${t.transport.models}${t.transport.tier ? ' · ' + t.transport.tier : ''}`;
          setEl('bd-tx-detail', detail);
        } else {
          txSec.style.display = 'none';
        }
      }
      
      const invoiceTable = document.getElementById('bd-invoice-table');
      if (invoiceTable) {
        invoiceTable.innerHTML = `<tr class="bd-total"><td>Total Paid</td><td>₹${Number(t.total||0).toLocaleString()}</td></tr>`;
      }
        
      document.getElementById('booking-detail-modal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (e) {
      console.error(e);
    }
  };
  fetchAndShow();
}

function closeBookingDetail() {
  document.getElementById('booking-detail-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  _detailTrip = null;
}

function downloadInvoice() {
  showToast('✓ Invoice downloaded!');
}

function showHelpTopic(topic, card) {
  const allCards = document.querySelectorAll('.help-cat-card');
  allCards.forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const allContents = document.querySelectorAll('.help-content');
  allContents.forEach(c => c.style.display = 'none');
  const target = document.getElementById('help-' + topic);
  if (target) target.style.display = 'block';
}

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function closeUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.style.display = 'none';
}

document.addEventListener('click', function(e) {
  const btn = document.getElementById('btn-user');
  if (btn && !btn.contains(e.target)) closeUserMenu();
  const authModal = document.getElementById('auth-modal');
  if (e.target === authModal) closeModal();
  const cancelModal = document.getElementById('cancel-confirm-modal');
  if (e.target === cancelModal && typeof closeCancelModal === 'function') closeCancelModal();
});

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !icon || !msgEl) return;
  toast.classList.remove('toast-error');
  if (type === 'error') toast.classList.add('toast-error');
  msgEl.textContent = msg;
  icon.textContent = type === 'error' ? '!' : '✓';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatCard(input) {
  let v = input.value.replace(/\s+/g,'').replace(/[^0-9]/gi,'');
  let matches = v.match(/\d{4,16}/g);
  let match = (matches && matches[0]) || '';
  let parts = [];
  for (let i=0, len=match.length; i<len; i+=4) parts.push(match.substring(i, i+4));
  input.value = parts.length ? parts.join(' ') : v;
}

function openModal(tab) {
  document.getElementById('auth-modal')?.classList.add('open');
  if (tab === 'signup') switchAuthTab('signup');
  else switchAuthTab('signin');
}

function closeModal() {
  document.getElementById('auth-modal')?.classList.remove('open');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-toggle').forEach(f => f.classList.remove('active'));
  document.getElementById('tab-' + (tab==='signin'?'signin':'signup-tab'))?.classList.add('active');
  document.getElementById('form-' + tab)?.classList.add('active');
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content + missing_code)

print("Updated main.js successfully!")
