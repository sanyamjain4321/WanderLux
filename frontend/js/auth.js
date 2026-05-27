// ═══════════════════════════════════════════════════════════
// frontend/js/auth.js — Authentication Logic
// ═══════════════════════════════════════════════════════════

// Boot session
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
});

function restoreSession() {
  const user = WL.getUser();
  if (user && WL.isLoggedIn()) {
    updateNavForUser(user);
  }
}

function updateNavForUser(user) {
  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) {
    loginBtn.textContent = user.first_name;
    loginBtn.onclick = () => showPage('profile');
  }
  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = `${user.first_name} ${user.last_name}`;
  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) profileEmail.textContent = user.email;
}

window.doSignIn = async function() {
  const email    = document.getElementById('signin-email')?.value.trim();
  const password = document.getElementById('signin-password')?.value;
  if (!email || !password) { showToast('Please enter email and password', 'error'); return; }

  const btn = document.querySelector('#form-signin .btn-auth');
  if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }

  try {
    const res = await WL.login(email, password);
    // WL.login already persists token + user to localStorage via setToken/setUser
    closeModal();
    updateNavForUser(res.user);
    showToast(`✓ Welcome back, ${res.user.first_name}!`);
    try {
      const w = await WL.getWishlistIds();
      _wishlistIds = new Set(w.ids);
      wishlist = _wishlistIds;
      renderHomePackages();
      renderAllPackages(allPackagesFiltered);
    } catch (_) {}
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  } finally {
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
  }
};

window.doSignUp = async function() {
  const fname    = document.getElementById('su-fname')?.value.trim();
  const lname    = document.getElementById('su-lname')?.value.trim();
  const email    = document.getElementById('su-email')?.value.trim();
  const password = document.getElementById('su-password')?.value;
  if (!fname || !lname || !email || !password) { showToast('All fields required', 'error'); return; }

  const btn = document.querySelector('#form-signup .btn-auth');
  if (btn) { btn.textContent = 'Creating…'; btn.disabled = true; }

  try {
    const res = await WL.register(fname, lname, email, password);
    // WL.register already persists token + user to localStorage
    closeModal();
    updateNavForUser(res.user);
    showToast(`✓ Account created! Welcome, ${res.user.first_name}!`);
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
  } finally {
    if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
  }
};

window.doLogout = function() {
  WL.logout();
  // Clear wishlist state
  _wishlistIds.clear();
  wishlist = _wishlistIds;
  // Reset nav button
  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) { loginBtn.textContent = 'Sign In'; loginBtn.onclick = openModal; }
  // Reset profile fields
  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = '';
  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) profileEmail.textContent = '';
  showPage('home');
  showToast('Logged out successfully');
};
