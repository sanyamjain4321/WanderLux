/**
 * ═══════════════════════════════════════════════════════════
 * public/api.js — Wanderlux Frontend API Client
 * All fetch calls to the Express backend live here.
 * ═══════════════════════════════════════════════════════════
 */

const API_BASE = '/api';
// ── Token helpers ────────────────────────────────────────────
const getToken  = ()      => localStorage.getItem('wdl_token');
const setToken  = (token) => localStorage.setItem('wdl_token', token);
const clearToken= ()      => localStorage.removeItem('wdl_token');
const getUser   = ()      => { try { return JSON.parse(localStorage.getItem('wdl_user')); } catch { return null; } };
const setUser   = (user)  => localStorage.setItem('wdl_user', JSON.stringify(user));
const clearUser = ()      => localStorage.removeItem('wdl_user');

/**
 * apiFetch — wrapper around fetch that:
 *  - prepends /api
 *  - injects Authorization: Bearer <token>
 *  - returns parsed JSON
 *  - throws on non-2xx
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Auto-logout on expired/invalid token
    if (res.status === 401) {
      clearToken();
      clearUser();
    }
    const err = new Error(data.message || 'API error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

async function apiRegister(first_name, last_name, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ first_name, last_name, email, password })
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

async function apiLogin(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

function apiLogout() {
  clearToken();
  clearUser();
}

async function apiGetMe() {
  return apiFetch('/auth/me');
}

async function apiUpdateProfile(payload) {
  return apiFetch('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// ════════════════════════════════════════════════════════════
// PACKAGES
// ════════════════════════════════════════════════════════════

async function apiGetPackages(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/packages${qs ? '?' + qs : ''}`);
}

async function apiGetFeaturedPackages() {
  return apiFetch('/packages/featured');
}

async function apiSearchPackages(q) {
  return apiFetch(`/packages/search?q=${encodeURIComponent(q)}`);
}

async function apiGetPackageById(id) {
  return apiFetch(`/packages/${id}`);
}

// ════════════════════════════════════════════════════════════
// DESTINATIONS
// ════════════════════════════════════════════════════════════

async function apiGetDestinations() {
  return apiFetch('/destinations');
}

// ════════════════════════════════════════════════════════════
// WISHLIST
// ════════════════════════════════════════════════════════════

async function apiGetWishlist() {
  return apiFetch('/wishlist');
}

async function apiGetWishlistIds() {
  return apiFetch('/wishlist/ids');
}

async function apiToggleWishlist(packageId, isCurrentlyWishlisted) {
  if (isCurrentlyWishlisted) {
    return apiFetch(`/wishlist/${packageId}`, { method: 'DELETE' });
  } else {
    return apiFetch(`/wishlist/${packageId}`, { method: 'POST' });
  }
}

// ════════════════════════════════════════════════════════════
// BOOKINGS
// ════════════════════════════════════════════════════════════

async function apiCreateBooking(payload) {
  return apiFetch('/bookings', { method: 'POST', body: JSON.stringify(payload) });
}

async function apiGetMyTrips() {
  return apiFetch('/bookings/my-trips');
}

async function apiGetBookingById(id) {
  return apiFetch(`/bookings/${id}`);
}

async function apiCancelBooking(id, reason) {
  return apiFetch(`/bookings/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
}

// ════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════

async function apiCreatePayment(booking_id, payment_method, card_last4, card_brand) {
  return apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({ booking_id, payment_method, card_last4, card_brand })
  });
}

async function apiGetMyPayments() {
  return apiFetch('/payments/my');
}

// ════════════════════════════════════════════════════════════
// INVOICES
// ════════════════════════════════════════════════════════════

async function apiGetMyInvoices() {
  return apiFetch('/invoices/my');
}

async function apiGetInvoiceByBooking(booking_id) {
  return apiFetch(`/invoices/booking/${booking_id}`);
}

// ════════════════════════════════════════════════════════════
// CANCELLATIONS  (full delete from DB)
// ════════════════════════════════════════════════════════════

async function apiCancelAndDelete(booking_id, reason) {
  return apiFetch(`/cancellations/${booking_id}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

async function apiGetMyCancellations() {
  return apiFetch('/cancellations/my');
}

// ════════════════════════════════════════════════════════════
// CUSTOMER SUPPORT
// ════════════════════════════════════════════════════════════

async function apiCreateSupportTicket(payload) {
  return apiFetch('/support', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function apiGetMyTickets() {
  return apiFetch('/support/my');
}

// ════════════════════════════════════════════════════════════
// TRANSPORT
// ════════════════════════════════════════════════════════════

async function apiGetTransport(type) {
  return apiFetch(`/transport?type=${type || 'domestic'}`);
}

// ════════════════════════════════════════════════════════════
// COUPONS
// ════════════════════════════════════════════════════════════

async function apiValidateCoupon(code, order_amount) {
  return apiFetch('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, order_amount })
  });
}

// ════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════

async function apiGetReviews(packageId) {
  const qs = packageId ? `?packageId=${packageId}` : '';
  return apiFetch(`/reviews${qs}`);
}

async function apiCreateReview(payload) {
  return apiFetch('/reviews', { method: 'POST', body: JSON.stringify(payload) });
}

// ════════════════════════════════════════════════════════════
// LIVE RATING UPDATER
// Called after a review is submitted — uses the value returned
// by the backend (which reads from the DB after the trigger runs)
// to update the star rating shown on any visible package card.
// ════════════════════════════════════════════════════════════
function applyLiveRating(packageId, liveRating, liveReviews) {
  if (!packageId || !liveRating) return;
  // Update all rating elements on the page that reference this package
  document.querySelectorAll(`[data-pkg-id="${packageId}"] .pkg-rating,
                             [data-package-id="${packageId}"] .pkg-rating`).forEach(el => {
    el.textContent = `★ ${Number(liveRating).toFixed(1)}`;
  });
  if (liveReviews != null) {
    document.querySelectorAll(`[data-pkg-id="${packageId}"] .pkg-reviews,
                               [data-package-id="${packageId}"] .pkg-reviews`).forEach(el => {
      el.textContent = `(${liveReviews})`;
    });
  }
}

// ════════════════════════════════════════════════════════════
// EXPORTS — attach everything to window so index.html can use it
// ════════════════════════════════════════════════════════════
window.WL = {
  // token / user
  getToken, getUser, isLoggedIn: () => !!getToken(),

  // auth
  register:         apiRegister,
  login:            apiLogin,
  logout:           apiLogout,
  getMe:            apiGetMe,
  updateProfile:    apiUpdateProfile,

  // packages
  getPackages:      apiGetPackages,
  getFeatured:      apiGetFeaturedPackages,
  search:           apiSearchPackages,
  getPackage:       apiGetPackageById,

  // destinations
  getDestinations:  apiGetDestinations,

  // wishlist
  getWishlist:      apiGetWishlist,
  getWishlistIds:   apiGetWishlistIds,
  toggleWishlist:   apiToggleWishlist,

  // bookings
  createBooking:    apiCreateBooking,
  getMyTrips:       apiGetMyTrips,
  getBooking:       apiGetBookingById,
  cancelBooking:    apiCancelBooking,

  // payments
  createPayment:        apiCreatePayment,
  getMyPayments:        apiGetMyPayments,

  // invoices
  getMyInvoices:        apiGetMyInvoices,
  getInvoiceByBooking:  apiGetInvoiceByBooking,

  // cancellations (hard-delete from DB)
  cancelAndDelete:      apiCancelAndDelete,
  getMyCancellations:   apiGetMyCancellations,

  // customer support
  createSupportTicket:  apiCreateSupportTicket,
  getMyTickets:         apiGetMyTickets,

  // transport
  getTransport:     apiGetTransport,

  // coupons
  validateCoupon:   apiValidateCoupon,

  // reviews
  getReviews:       apiGetReviews,
  createReview:     apiCreateReview,
  applyLiveRating:  applyLiveRating,
};

console.log('✅ Wanderlux API client loaded. Use window.WL.*');
