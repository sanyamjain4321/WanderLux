// ═══════════════════════════════════════════════════════════
// frontend/js/profile.js — Profile & User Settings
// ═══════════════════════════════════════════════════════════

window.renderProfile = async function() {
  if (!WL.isLoggedIn()) { if (typeof openModal === 'function') openModal(); return; }

  try {
    const { user } = await WL.getMe();

    const fullName  = `${user.first_name} ${user.last_name}`.trim();
    const firstName = user.first_name || '';

    // Navigation / header display
    const nameEl  = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    if (nameEl)  nameEl.textContent  = fullName;
    if (emailEl) emailEl.textContent = user.email;

    // Profile page display name / email
    const dispName  = document.getElementById('profile-display-name');
    const dispEmail = document.getElementById('profile-display-email');
    if (dispName)  dispName.textContent  = fullName;
    if (dispEmail) dispEmail.textContent = user.email;

    // Editable form fields
    const pfName  = document.getElementById('pf-name');
    const pfFname = document.getElementById('pf-fname');
    const pfLname = document.getElementById('pf-lname');
    const pfEmail = document.getElementById('pf-email');
    if (pfName)  pfName.value  = fullName;
    if (pfFname) pfFname.value = user.first_name || '';
    if (pfLname) pfLname.value = user.last_name  || '';
    if (pfEmail) pfEmail.value = user.email;

    // Avatar initials
    const initials = fullName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || 'W';
    const avatarEl = document.getElementById('profile-avatar-circle');
    if (avatarEl) avatarEl.textContent = initials;

    // Nav dropdown
    const menuName     = document.getElementById('user-menu-name');
    const dropUsername = document.getElementById('dropdown-username');
    if (menuName)     menuName.textContent     = firstName || 'My Account';
    if (dropUsername) dropUsername.textContent = fullName;

    // Stats from DB (real counts)
    const tripsEl = document.getElementById('profile-trips-count');
    if (tripsEl)  tripsEl.textContent = user.total_trips || 0;

    const pstatTrips = document.getElementById('pstat-trips');
    if (pstatTrips) pstatTrips.textContent = user.total_trips || 0;

    const pstatSpent = document.getElementById('pstat-spent');
    if (pstatSpent) {
      const spent = Number(user.total_spent || 0);
      pstatSpent.textContent = spent > 0 ? '₹' + (spent / 1000).toFixed(0) + 'k' : '₹0';
    }

    // Destinations stat — derived from trips if available
    const pstatDest = document.getElementById('pstat-destinations');
    if (pstatDest && typeof WL !== 'undefined') {
      try {
        const { bookings } = await WL.getMyTrips();
        const dests = new Set(bookings.map(b => b.pkg_location)).size;
        pstatDest.textContent = dests;
      } catch (_) {}
    }

  } catch (err) {
    console.error('Failed to load profile', err);
  }
};

window.saveProfile = async function() {
  if (!WL.isLoggedIn()) return;

  // Support both split-name and combined-name form fields
  let firstName = document.getElementById('pf-fname')?.value.trim();
  let lastName  = document.getElementById('pf-lname')?.value.trim();
  if (!firstName) {
    const full = (document.getElementById('pf-name')?.value || '').trim().split(' ');
    firstName = full[0] || '';
    lastName  = full.slice(1).join(' ') || '';
  }
  const email = document.getElementById('pf-email')?.value.trim();

  if (!firstName || !email) {
    if (typeof showToast === 'function') showToast('Please fill all required fields', 'error');
    return;
  }

  const btn = document.querySelector('.btn-save-profile') || document.querySelector('[onclick*="saveProfile"]');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  try {
    await WL.updateProfile({ first_name: firstName, last_name: lastName || '', email });
    if (typeof showToast === 'function') showToast('✓ Profile updated successfully!');

    // Keep localStorage in sync
    const user = WL.getUser();
    if (user) {
      user.first_name = firstName;
      user.last_name  = lastName || '';
      user.email      = email;
      localStorage.setItem('wdl_user', JSON.stringify(user));
      if (typeof updateNavForUser === 'function') updateNavForUser(user);
    }

    // Re-render to reflect saved values
    await window.renderProfile();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
  }
};
