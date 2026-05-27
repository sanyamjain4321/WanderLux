// ═══════════════════════════════════════════════════════════
// frontend/js/packages.js — Packages, Wishlist, Destinations
// ═══════════════════════════════════════════════════════════

let _packages = [];
let _destinations = [];
let _wishlistIds = new Set();
window.wishlist = _wishlistIds;
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [pkgRes, destRes] = await Promise.all([
      WL.getPackages(),
      WL.getDestinations()
    ]);
    
   const packageList = pkgRes.data || pkgRes.packages || [];
const destinationList = destRes.data || destRes.destinations || [];

console.log("PACKAGE API RESPONSE:", pkgRes);
console.log("NORMALIZED PACKAGES:", packageList);

_packages = packageList.map(normPkg);
_destinations = destinationList;
    
    // Set global variables for legacy ui_logic.js to use
    window.packages = [..._packages];
    window.allPackagesFiltered = [..._packages];
    
    renderHomePackages();
    renderDestinations();
    renderAllPackages(_packages);

    if (WL.isLoggedIn()) {
      try {
        const w = await WL.getWishlistIds();
        _wishlistIds = new Set(w.ids);
        window.wishlist = _wishlistIds;
        renderHomePackages();
        renderAllPackages(_packages);
      } catch (_) {}
    }
  } catch (err) {
    console.error('API boot failed:', err.message);
  }
});

function normPkg(p) {
  let cat = p.category || p.badge || 'popular';
  if (typeof cat === 'string') {
    cat = cat.split(',').map(s => s.trim());
  }
    let hi = p.highlights;
    if (typeof hi === 'string') { try { hi = JSON.parse(hi); } catch(e) { hi = hi.split(',').map(s=>s.trim()); } }
    let iti = p.itinerary;
    if (typeof iti === 'string') { try { iti = JSON.parse(iti); } catch(e) { iti = []; } }
    let trans = p.transport_options || p.transport;
    if (typeof trans === 'string') { try { trans = JSON.parse(trans); } catch(e) { trans = []; } }
    
  return {
    id:          p.id || p.pkg_id,
    title:       p.title || p.name,
    location:    p.location || '',
    duration:    p.duration || '',
    days:        p.days || p.total_days || 0,
    price:       parseFloat(p.price_usd || p.price || 0),
    price_usd:   parseFloat(p.price_usd || p.price || 0),
    rating:      parseFloat(p.rating || 0),
    reviews:     p.reviews_count || p.reviews || 0,
    badge:       p.badge || 'popular',
    badgeLabel:  p.badge_label || p.badgeLabel || p.badge || '',
    category:    cat,
    image:       p.image_url || p.image || '',
    image_url:   p.image_url || p.image || '',
    highlights:  Array.isArray(hi) ? hi : [],
    description: p.description || '',
    itinerary:   Array.isArray(iti) ? iti : [],
    includes:    p.includes || ["Premium Accommodation", "Daily Breakfast", "Airport Transfers", "Local Guide"],
    excludes:    p.excludes || ["International Flights", "Personal Expenses", "Travel Insurance"],
    transport:   Array.isArray(trans) ? trans : []
  };
}
window.renderDestinations = function() {
  const el = document.getElementById('dest-scroll');
  if (!el || !_destinations.length) return;
  el.innerHTML = _destinations.map(d => {
    const imgSrc = (d.image_url || d.image || '').replace(/\?.*$/, '') + '?w=600&q=75&fit=crop&auto=format';
    const count = d.count || d.package_count || d.pkg_count || 0;
    return `
    <div class="dest-card" onclick="filterAndShow('${d.name}')">
      <img src="${imgSrc}" alt="${d.name}" loading="lazy"
        onerror="this.style.display='none'">
      <div class="dest-card-body">
        <div class="dest-name">${d.name}</div>
        <div class="dest-count">${count} package${count !== 1 ? 's' : ''}</div>
      </div>
    </div>`;
  }).join('');
};

window.toggleWishlist = async function(e, pkgId) {
  e.stopPropagation();
  if (!WL.isLoggedIn()) { openModal(); showToast('Sign in to save to wishlist'); return; }

  const isWished = _wishlistIds.has(pkgId);
  if (isWished) _wishlistIds.delete(pkgId); else _wishlistIds.add(pkgId);
  window.wishlist = _wishlistIds;

  document.querySelectorAll(`[onclick*="toggleWishlist(event,${pkgId})"]`).forEach(btn => {
    btn.textContent = _wishlistIds.has(pkgId) ? '♥' : '♡';
    btn.classList.toggle('wishlisted', _wishlistIds.has(pkgId));
  });

  try {
    await WL.toggleWishlist(pkgId, isWished);
    showToast(isWished ? 'Removed from wishlist' : '♥ Saved to wishlist');
  } catch (err) {
    if (isWished) _wishlistIds.add(pkgId); else _wishlistIds.delete(pkgId);
    window.wishlist = _wishlistIds;
    showToast(err.message || 'Failed to update wishlist', 'error');
  }
};

window.renderWishlist = async function() {
  const container = document.getElementById('wishlist-container');
  if (!container) return;

  if (!WL.isLoggedIn()) {
    container.innerHTML = `<div style="text-align:center;padding:4rem;"><button class="btn-book" onclick="openModal()">Sign In to View Wishlist</button></div>`;
    return;
  }
  try {
    const { wishlist: items } = await WL.getWishlist();
    if (!items.length) {
      container.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--warm-grey);">Your wishlist is empty. Heart any package to save it!</div>`;
      return;
    }
    const html = items.map(i => renderPackageCard(normPkg({...i, pkg_id: i.package_id}))).join('');
    container.innerHTML = `<div class="packages-grid">${html}</div>`;
  } catch (err) {
    container.innerHTML = `<div style="color:var(--terra);padding:2rem;">${err.message}</div>`;
  }
};
