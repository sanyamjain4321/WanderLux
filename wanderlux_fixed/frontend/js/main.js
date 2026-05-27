// ═══════════════════════════════════════════════════════════
// frontend/js/main.js — Global UI & Interaction Logic
// ═══════════════════════════════════════════════════════════

let currentPackage = null;
let myTrips = [];
let searchState = {
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
  tripType: 'oneway'
};

const testimonials = [
  { text: "Wanderlux turned my Bali trip into a life-changing experience. Every detail was perfect — the local guides were extraordinary, the riad they chose was magical.", author: "Ananya Krishnan", trip: "Bali Sacred Journey", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=face" },
  { text: "The Rajasthan trip exceeded every expectation. Sleeping in a real maharaja palace, the camel safari at golden hour — I still can't quite believe it was real.", author: "James & Emma Thornton", trip: "Rajasthan Royal Experience", rating: 5, avatar: "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=100&q=80&fit=crop&crop=face" },
  { text: "My first proper adventure was the Nepal trek with Wanderlux. The sherpa guides were the highlight — their knowledge and warmth made the journey extraordinary.", author: "Rohan Mehta", trip: "Nepal Himalaya Trek", rating: 5, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80&fit=crop&crop=face" },
];


document.addEventListener('DOMContentLoaded', () => {
  // Default date for booking form
  const d = new Date(); d.setMonth(d.getMonth()+2);
  const iso = d.toISOString().split('T')[0];
  const bkDate = document.getElementById('bk-date');
  if(bkDate) bkDate.value = iso;
  
  if (typeof calInit === 'function') calInit();
});
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'trips') renderTrips();
  if (page === 'profile') renderProfile();
}

function footerFilter(cat) {
  showPage('packages');
  // reset filter buttons
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (cat === 'all') {
    allPackagesFiltered = [...packages];
    const allBtn = document.querySelector('.filter-btn');
    if (allBtn) allBtn.classList.add('active');
  } else {
    allPackagesFiltered = packages.filter(p => p.category.includes(cat));
    // highlight matching filter button
    document.querySelectorAll('.filter-btn').forEach(b => {
      if (b.textContent.trim().toLowerCase().includes(cat)) b.classList.add('active');
    });
  }
  renderAllPackages(allPackagesFiltered);
  const count = document.getElementById('packages-count');
  if (count) count.textContent = allPackagesFiltered.length + ' packages found';
}



function requireAuth(page) {
  if (WL.isLoggedIn()) { showPage(page); renderTrips(); }
  else { openModal(); }
}

// ═══════════════════════════════════════
//   RENDER HOME
// ═══════════════════════════════════════
function renderHomePackages() {
  const featured = packages.slice(0, 3);
  document.getElementById('home-packages').innerHTML = featured.map(renderPackageCard).join('');
}

function renderDestinations() {
  document.getElementById('dest-scroll').innerHTML = destinations.map(d => {
    // Use w=600 for crisp display, auto=format for WebP where supported, q=75 for faster load
    const imgSrc = d.image.replace(/\?.*$/, '') + '?w=600&q=75&fit=crop&auto=format';
    return `
    <div class="dest-card" onclick="filterAndShow('${d.name}')">
      <img src="${imgSrc}" alt="${d.name}" loading="eager" decoding="async" fetchpriority="high"
        onerror="this.style.display='none'; this.nextElementSibling && (this.nextElementSibling.style.display='flex')"
        style="display:block;">
      <div class="dest-img-fallback" style="display:none;width:100%;height:120px;background:linear-gradient(135deg,var(--forest),var(--forest-light));align-items:center;justify-content:center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
      <div class="dest-card-body">
        <div class="dest-name">${d.name}</div>
        <div class="dest-count">${d.count} packages</div>
      </div>
    </div>
  `}).join('');
}

function renderTestimonials() {
  document.getElementById('testimonials-grid').innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-quote">"</div>
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <img src="${t.avatar}" alt="${t.author}" class="author-avatar">
        <div>
          <div class="author-name">${t.author}</div>
          <div class="author-trip">${t.trip}</div>
          <div class="author-stars">${'★'.repeat(t.rating)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════
//   PACKAGE CARDS
// ═══════════════════════════════════════
function renderPackageCard(pkg) {
  const isWished = wishlist.has(pkg.id);
  // Strip existing params and use optimised ones: WebP via auto=format, q=75 (much faster than q=80)
  const imgSrc = pkg.image.replace(/\?.*$/, '') + '?w=640&q=75&fit=crop&auto=format';
  return `
    <div class="pkg-card" onclick="openPackage(${pkg.id})">
      <div class="pkg-img">
        <img src="${imgSrc}" alt="${pkg.title}" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1488085061387-422e29b40080?w=640&q=75&fit=crop&auto=format'; this.onerror=null;">
        <span class="pkg-badge badge-${pkg.badge}">${pkg.badgeLabel}</span>
        <button class="pkg-wishlist ${isWished?'wishlisted':''}" onclick="toggleWishlist(event,${pkg.id})">${isWished?'♥':'♡'}</button>
      </div>
      <div class="pkg-body">
        <div class="pkg-meta">
          <div class="pkg-duration"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${pkg.duration}</div>
          <div class="pkg-rating"><span class="pkg-stars">★</span> ${pkg.rating} <span style="color:var(--warm-grey);font-weight:400;">(${pkg.reviews})</span></div>
        </div>
        <div class="pkg-title">${pkg.title}</div>
        <div class="pkg-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${pkg.location}</div>
        <div class="pkg-highlights">
          ${pkg.highlights.slice(0,3).map(h=>`<span class="highlight-chip">${h}</span>`).join('')}
        </div>
        <div class="pkg-footer">
          <div class="pkg-price">
            <span class="pkg-price-from">From</span>
            <span class="pkg-price-amount">₹${(pkg.price*83).toLocaleString()}</span>
            <span class="pkg-price-pp"> / person</span>
          </div>
          <button class="btn-book" onclick="event.stopPropagation(); openPackage(${pkg.id})">View Details</button>
        </div>
      </div>
    </div>
  `;
}

function renderAllPackages(list) {
  const container = document.getElementById('all-packages');
  const count = document.getElementById('packages-count');
  if (!container) return;
  count.textContent = `Showing ${list.length} package${list.length !== 1 ? 's' : ''}`;
  container.innerHTML = list.map(renderPackageCard).join('');
}

// ═══════════════════════════════════════
//   FILTER & SORT
// ═══════════════════════════════════════
function filterPackages(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (cat === 'all') { allPackagesFiltered = [...packages]; }
  else { allPackagesFiltered = packages.filter(p => p.category.includes(cat)); }
  renderAllPackages(allPackagesFiltered);
}

function sortPackages(val) {
  let sorted = [...allPackagesFiltered];
  if (val === 'price-asc') sorted.sort((a,b) => a.price - b.price);
  else if (val === 'price-desc') sorted.sort((a,b) => b.price - a.price);
  else if (val === 'rating') sorted.sort((a,b) => b.rating - a.rating);
  else if (val === 'duration') sorted.sort((a,b) => a.days - b.days);
  renderAllPackages(sorted);
}

function filterAndShow(destName) {
  showPage('packages');
  const filtered = packages.filter(p =>
    p.location.toLowerCase().includes(destName.toLowerCase()) ||
    p.title.toLowerCase().includes(destName.toLowerCase()) ||
    (p.highlights && p.highlights.some(h => h.toLowerCase().includes(destName.toLowerCase()))) ||
    (p.category && p.category.some(c => c.toLowerCase().includes(destName.toLowerCase())))
  );
  allPackagesFiltered = filtered;
  const container = document.getElementById('all-packages');
  const count = document.getElementById('packages-count');
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');
  if (filtered.length === 0) {
    count.textContent = `No packages found for "${destName}"`;
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;background:var(--white);border-radius:12px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--sand-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;margin-bottom:0.5rem;">No packages found</h3>
        <p style="color:var(--warm-grey);margin-bottom:1.5rem;">We couldn't find any trips matching <strong>"${destName}"</strong>. Try a different destination or browse all packages.</p>
        <button class="btn-book-now" style="display:inline-block;width:auto;padding:12px 32px;" onclick="filterPackages('all', document.querySelector('.filter-btn'))">Browse All Packages</button>
      </div>`;
  } else {
    renderAllPackages(filtered);
  }
}

// ═══════════════════════════════════════
//   SEARCH WIDGET JS
// ═══════════════════════════════════════
function swUpdateDest(val) {
  const sug  = document.getElementById('sw-suggestions');
  if (val.trim()) {
    const placematches = allPlaces.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 4);
    const pkgmatches = packages.filter(p =>
      p.title.toLowerCase().includes(val.toLowerCase()) ||
      p.location.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 3);
    const allMatches = [
      ...placematches.map(m => ({ label: m.name, sub: m.sub, type: 'place' })),
      ...pkgmatches.map(p => ({ label: p.title, sub: p.location, type: 'package', id: p.id }))
    ].slice(0, 6);
    if (allMatches.length) {
      sug.style.display = 'block';
      sug.innerHTML = allMatches.map(m => `<div onclick="swPickDest('${m.label.replace(/'/g,"\\'")}',${m.type==='package'?m.id:'null'})" style="padding:10px 18px;cursor:pointer;font-size:0.875rem;color:var(--ink);border-bottom:1px solid #f5f0ea;transition:background 0.12s;" onmouseover="this.style.background='#fdf8f3'" onmouseout="this.style.background=''"><strong>${m.label}</strong> <span style="color:var(--warm-grey);font-size:0.78rem;">— ${m.sub}${m.type==='package'?' ◈':''}</span></div>`).join('');
    } else { sug.style.display = 'none'; }
  } else { sug.style.display = 'none'; }
}

function swPickDest(val, pkgId) {
  document.getElementById('search-dest').value = '';
  document.getElementById('search-dest').style.display = 'none';
  document.getElementById('sw-dest-display').textContent = val;
  document.getElementById('sw-dest-display').style.color = 'var(--ink)';
  document.getElementById('sw-dest-display').style.fontSize = '1.6rem';
  document.getElementById('sw-dest-sub').textContent = 'Selected destination';
  document.getElementById('sw-to-display-wrap').style.display = 'block';
  document.getElementById('sw-suggestions').style.display = 'none';
  searchState.dest = val;
  // store the typed value for search
  document.getElementById('search-dest').setAttribute('data-value', val);
}
let swClass = 'Economy';
let swActiveTab = 'packages';
let swTripType = 'oneway';
let swPaxCount = 1;

// All searchable places (From + To)
const allPlaces = [
  // Indian cities
  { name: 'Mumbai', sub: 'Maharashtra, India' },
  { name: 'Delhi', sub: 'New Delhi, India' },
  { name: 'Bangalore', sub: 'Karnataka, India' },
  { name: 'Chennai', sub: 'Tamil Nadu, India' },
  { name: 'Hyderabad', sub: 'Telangana, India' },
  { name: 'Kolkata', sub: 'West Bengal, India' },
  { name: 'Pune', sub: 'Maharashtra, India' },
  { name: 'Ahmedabad', sub: 'Gujarat, India' },
  { name: 'Kochi', sub: 'Kerala, India' },
  { name: 'Jaipur', sub: 'Rajasthan, India' },
  { name: 'Goa', sub: 'India' },
  { name: 'Srinagar', sub: 'J&K, India' },
  { name: 'Leh', sub: 'Ladakh, India' },
  { name: 'Udaipur', sub: 'Rajasthan, India' },
  { name: 'Varanasi', sub: 'Uttar Pradesh, India' },
  { name: 'Amritsar', sub: 'Punjab, India' },
  { name: 'Agra', sub: 'Uttar Pradesh, India' },
  // International
  { name: 'Bali', sub: 'Denpasar, Indonesia' },
  { name: 'Bangkok', sub: 'Thailand' },
  { name: 'Dubai', sub: 'UAE' },
  { name: 'Singapore', sub: 'Singapore' },
  { name: 'Kathmandu', sub: 'Nepal' },
  { name: 'Colombo', sub: 'Sri Lanka' },
  { name: 'Thimphu', sub: 'Bhutan' },
  { name: 'Kuala Lumpur', sub: 'Malaysia' },
  { name: 'Tokyo', sub: 'Japan' },
  { name: 'Kyoto', sub: 'Japan' },
  { name: 'Santorini', sub: 'Greece' },
  { name: 'Paris', sub: 'France' },
  { name: 'London', sub: 'United Kingdom' },
  { name: 'Nairobi', sub: 'Kenya' },
  { name: 'Marrakech', sub: 'Morocco' },
  { name: 'Punta Arenas', sub: 'Patagonia, Chile' },
  { name: 'Maldives', sub: 'Indian Ocean' },
  { name: 'Port Blair', sub: 'Andaman Islands, India' },
];

function setTripType(type) {
  swTripType = type;
  document.getElementById('btn-oneway').classList.toggle('active', type === 'oneway');
  document.getElementById('btn-roundtrip').classList.toggle('active', type === 'roundtrip');
  const returnField = document.getElementById('sw-return-field');
  returnField.style.display = type === 'roundtrip' ? 'block' : 'none';
}

function swSetTab(btn, tab) {
  document.querySelectorAll('.sw-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  swActiveTab = tab;
}

function swFocusFrom() {
  const wrap = document.getElementById('sw-from-display-wrap');
  const inp  = document.getElementById('search-origin-text');
  wrap.style.display = 'none';
  inp.style.display = 'block';
  inp.focus();
  inp.select();
}

function swBlurFrom() {
  setTimeout(() => {
    const inp  = document.getElementById('search-origin-text');
    const wrap = document.getElementById('sw-from-display-wrap');
    // Only restore if a place was selected (origin-name not placeholder)
    document.getElementById('sw-from-suggestions').style.display = 'none';
    inp.style.display = 'none';
    wrap.style.display = 'block';
  }, 200);
}

function swFocusTo() {
  const wrap = document.getElementById('sw-to-display-wrap');
  const inp  = document.getElementById('search-dest');
  wrap.style.display = 'none';
  inp.style.display = 'block';
  inp.focus();
  inp.select();
}

function swBlurTo() {
  setTimeout(() => {
    const inp  = document.getElementById('search-dest');
    const wrap = document.getElementById('sw-to-display-wrap');
    document.getElementById('sw-suggestions').style.display = 'none';
    inp.style.display = 'none';
    wrap.style.display = 'block';
  }, 200);
}

function swUpdateOriginText(val) {
  const sug = document.getElementById('sw-from-suggestions');
  if (val.trim()) {
    const matches = allPlaces.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
    if (matches.length) {
      sug.style.display = 'block';
      sug.innerHTML = matches.map(m => `<div onclick="swPickOrigin('${m.name.replace(/'/g,"\\'")}','${m.sub.replace(/'/g,"\\'")}')" style="padding:10px 18px;cursor:pointer;font-size:0.875rem;color:var(--ink);border-bottom:1px solid #f5f0ea;transition:background 0.12s;" onmouseover="this.style.background='#fdf8f3'" onmouseout="this.style.background=''"><strong>${m.name}</strong> <span style="color:var(--warm-grey);font-size:0.78rem;">— ${m.sub}</span></div>`).join('');
    } else { sug.style.display = 'none'; }
  } else { sug.style.display = 'none'; }
}

function swPickOrigin(name, sub) {
  document.getElementById('search-origin-text').value = '';
  document.getElementById('search-origin-text').style.display = 'none';
  const nameEl = document.getElementById('sw-origin-name');
  nameEl.textContent = name;
  nameEl.style.color = 'var(--ink)';
  nameEl.style.fontSize = '1.6rem';
  nameEl.style.fontWeight = '600';
  document.getElementById('sw-origin-sub').textContent = sub;
  document.getElementById('sw-from-display-wrap').style.display = 'block';
  document.getElementById('sw-from-suggestions').style.display = 'none';
  searchState.origin = name;
}

function swSwap() {
  const destInput  = document.getElementById('search-dest');
  const originInput = document.getElementById('search-origin-text');
  const originName = document.getElementById('sw-origin-name').textContent;
  const originSub  = document.getElementById('sw-origin-sub').textContent;
  const destName   = document.getElementById('sw-dest-display').textContent;
  const destSub    = document.getElementById('sw-dest-sub').textContent;
  if (destName === 'Where to?' || !destName.trim()) return;
  // Swap display
  document.getElementById('sw-origin-name').textContent = destName;
  document.getElementById('sw-origin-sub').textContent = destSub;
  document.getElementById('sw-dest-display').textContent = originName;
  document.getElementById('sw-dest-display').style.color = 'var(--ink)';
  document.getElementById('sw-dest-sub').textContent = originSub;
  destInput.value = originName;
  originInput.value = destName;
  searchState.origin = destName;
  searchState.dest = originName;
}

// ── Custom Calendar ──────────────────────────────────
const calState = {
  depart: { year: 0, month: 0, selected: null },
  return: { year: 0, month: 0, selected: null }
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function calInit() {
  const now = new Date();
  calState.depart.year  = now.getFullYear();
  calState.depart.month = now.getMonth();
  calState.return.year  = now.getFullYear();
  calState.return.month = now.getMonth();
  calRender('depart');
  calRender('return');
}

function swToggleCal(which, e) {
  e && e.stopPropagation();

  const me = document.getElementById('cal-' + which);
  if (!me) return; // 🔴 FIX 1

  const isOpen = me.classList.contains('open');

  // close all first
  document.querySelectorAll('.cal-popup').forEach(p => p.classList.remove('open'));

  if (!isOpen) {
    const fieldId = which === 'depart' ? 'sw-date-field' : 'sw-return-field';
    const field = document.getElementById(fieldId);
    if (!field) return; // 🔴 FIX 2

    const rect = field.getBoundingClientRect();

    const calW = 308;
    let left = rect.left;

    if (left + calW > window.innerWidth - 8) left = window.innerWidth - calW - 8;
    if (left < 8) left = 8;

    let top = rect.bottom + 8;

    const calH = 340;
    if (top + calH > window.innerHeight - 8) top = rect.top - calH - 8;

    me.style.left = left + 'px';
    me.style.top  = top + 'px';
    me.classList.add('open');

    if (typeof calRender === 'function') {
      calRender(which);
    }
  }
}

function calNav(which, dir) {
  calState[which].month += dir;
  if (calState[which].month > 11) { calState[which].month = 0; calState[which].year++; }
  if (calState[which].month < 0)  { calState[which].month = 11; calState[which].year--; }
  calRender(which);
}

function calRender(which) {
  const s     = calState[which];
  const today = new Date(); today.setHours(0,0,0,0);
  const label = document.getElementById('cal-' + which + '-label');
  const grid  = document.getElementById('cal-' + which + '-grid');
  if (!label || !grid) return;
  label.textContent = MONTHS[s.month] + ' ' + s.year;

  // For return calendar, dates up to and including departure are invalid
  let minReturnIso = null;
  if (which === 'return' && calState.depart.selected) {
    minReturnIso = calState.depart.selected;
  }

  // day-of-week headers
  let html = DAYS.map(d => `<div class="cal-dow">${d}</div>`).join('');

  // blank cells before 1st
  const firstDay = new Date(s.year, s.month, 1).getDay();
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day cal-empty"></div>`;

  // day cells
  const daysInMonth = new Date(s.year, s.month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(s.year, s.month, d);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isoStr = `${s.year}-${String(s.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSel  = s.selected === isoStr;
    const isInvalidReturn = minReturnIso && isoStr <= minReturnIso;
    let cls = 'cal-day';
    if (isPast || isInvalidReturn) cls += ' cal-past';
    if (isToday && !isInvalidReturn) cls += ' cal-today';
    if (isSel)    cls += ' cal-selected';
    html += `<div class="${cls}" onclick="calPickDay('${which}','${isoStr}')">${d}</div>`;
  }
  grid.innerHTML = html;
}

function calPickDay(which, isoStr) {
  // Validation: return date must be after departure date
  if (which === 'return' && calState.depart.selected) {
    if (isoStr <= calState.depart.selected) {
      showToast('Return date must be after departure date', 'error');
      return;
    }
  }
  if (which === 'depart' && calState.return.selected) {
    if (isoStr >= calState.return.selected) {
      // Clear the return date since it's now invalid
      calState.return.selected = null;
      document.getElementById('sw-return-big').textContent = 'Select Date';
      document.getElementById('sw-return-big').style.color = '#aaa';
      document.getElementById('sw-return-big').style.fontSize = '1.4rem';
      document.getElementById('sw-return-day').textContent = 'Click to choose';
      searchState.returnDate = null;
      calRender('return');
      showToast('Return date cleared — please re-select', 'neutral');
    }
  }

  calState[which].selected = isoStr;
  calRender(which);

  const d = new Date(isoStr + 'T00:00:00');
  const label = d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0,3) + " '" + String(d.getFullYear()).slice(2);
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];

  if (which === 'depart') {
    document.getElementById('sw-date-big').textContent = label;
    document.getElementById('sw-date-big').style.color = 'var(--ink)';
    document.getElementById('sw-date-big').style.fontSize = '1.6rem';
    document.getElementById('sw-date-day').textContent = dayName;
    searchState.date = isoStr;
  } else {
    document.getElementById('sw-return-big').textContent = label;
    document.getElementById('sw-return-big').style.color = 'var(--ink)';
    document.getElementById('sw-return-big').style.fontSize = '1.6rem';
    document.getElementById('sw-return-day').textContent = dayName;
    searchState.returnDate = isoStr;
  }

  // close after short delay so user sees selection
  setTimeout(() => document.querySelectorAll('.cal-popup').forEach(p => p.classList.remove('open')), 180);
}

function swTogglePax(e) {
  e.stopPropagation();
  const popup = document.getElementById('sw-pax-popup');
  popup.classList.toggle('open');
}
function swClosePax() { document.getElementById('sw-pax-popup').classList.remove('open'); }

function swAdjPax(delta) {
  swPaxCount = Math.max(1, Math.min(10, swPaxCount + delta));
  document.getElementById('pax-count').textContent = swPaxCount;
  document.getElementById('sw-pax-display').textContent = swPaxCount;
  document.getElementById('pax-minus').disabled = swPaxCount <= 1;
  document.getElementById('pax-plus').disabled  = swPaxCount >= 10;
  searchState.pax = String(swPaxCount);
}

function swSetClass(btn, cls) {
  document.querySelectorAll('.class-chip-sw').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  swClass = cls;
}

// Close pax popup, suggestions, and calendars on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('#sw-pax-field')) document.getElementById('sw-pax-popup')?.classList.remove('open');
  if (!e.target.closest('#sw-to-field'))  { const s = document.getElementById('sw-suggestions'); if(s) s.style.display='none'; }
  if (!e.target.closest('#sw-from-field')){ const s = document.getElementById('sw-from-suggestions'); if(s) s.style.display='none'; }
  if (!e.target.closest('#sw-date-field') && !e.target.closest('#sw-return-field')) {
    document.querySelectorAll('.cal-popup').forEach(p => p.classList.remove('open'));
  }
});

function swShakeField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('sw-field-error');
  field.style.animation = 'none';
  void field.offsetWidth;
  field.style.animation = 'swFieldShake 0.45s ease';
  setTimeout(() => { field.classList.remove('sw-field-error'); field.style.animation = ''; }, 1600);
}

function doSearch() {
  const originName = document.getElementById('sw-origin-name')?.textContent?.trim() || '';
  const destName   = document.getElementById('sw-dest-display')?.textContent?.trim() || '';
  const dateLabel  = document.getElementById('sw-date-big')?.textContent?.trim() || '';

  const originEmpty = !originName || originName === 'Where from?';
  const destEmpty   = !destName   || destName   === 'Where to?';
  const dateEmpty   = !dateLabel  || dateLabel  === 'Select Date';

  let firstError = null;

  if (originEmpty) {
    swShakeField('sw-from-field');
    if (!firstError) firstError = 'departure city';
  }
  if (destEmpty) {
    swShakeField('sw-to-field');
    if (!firstError) firstError = 'destination';
  }
  if (dateEmpty) {
    swShakeField('sw-date-field');
    if (!firstError) firstError = 'travel date';
  }

  if (originEmpty || destEmpty || dateEmpty) {
    const msgs = [];
    if (originEmpty) msgs.push('departure city');
    if (destEmpty)   msgs.push('destination');
    if (dateEmpty)   msgs.push('travel date');
    showToast('Please fill in: ' + msgs.join(', '), 'error');
    // Focus the first empty field
    if (originEmpty) { setTimeout(swFocusFrom, 50); }
    else if (destEmpty) { setTimeout(swFocusTo, 50); }
    else if (dateEmpty) { setTimeout(() => swToggleCal('depart', null), 50); }
    return;
  }

  searchState.origin = originName;
  searchState.date   = calState.depart.selected || '';
  searchState.pax    = String(swPaxCount);
  const dest = searchState.dest || document.getElementById('search-dest').getAttribute('data-value') || '';
  if (dest) { filterAndShow(dest); }
  else { showPage('packages'); renderAllPackages(packages); }
}

// ═══════════════════════════════════════
//   PACKAGE DETAIL
// ═══════════════════════════════════════
async function openPackage(id) {
  try {
    const res = await WL.getPackage(id);
    if (res.success && res.data) {
      currentPackage = normPkg(res.data);
    } else {
      currentPackage = packages.find(p => String(p.id) === String(id));
    }
  } catch(e) {
    currentPackage = packages.find(p => String(p.id) === String(id));
  }
  const pkg = currentPackage;
  if (!pkg) { console.error('Package not found for id:', id); return; }
  
  document.getElementById('detail-img').src = pkg.image;
  document.getElementById('detail-title').textContent = pkg.title;
  document.getElementById('detail-meta').innerHTML = `
    <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${pkg.location}</span>
    <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${pkg.duration}</span>
    <span>★ ${pkg.rating} (${pkg.reviews} reviews)</span>
  `;

  // Overview tab
  document.getElementById('tab-overview').innerHTML = `
    <p style="color:var(--ink-mid);line-height:1.8;margin-bottom:1.5rem;font-size:0.95rem;">${pkg.description}</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">
      <div style="background:var(--white);border-radius:10px;padding:1.25rem;">
        <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--warm-grey);margin-bottom:0.75rem;">Highlights</div>
        ${pkg.highlights.map(h=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:0.875rem;"><span style="color:var(--terra)">✦</span>${h}</div>`).join('')}
      </div>
      <div style="background:var(--white);border-radius:10px;padding:1.25rem;">
        <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--warm-grey);margin-bottom:0.75rem;">Trip Info</div>
        <div style="font-size:0.875rem;margin-bottom:6px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> <strong>${pkg.duration}</strong></div>
        <div style="font-size:0.875rem;margin-bottom:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <strong>${pkg.location}</strong></div>
        <div style="font-size:0.875rem;margin-bottom:6px;">★ <strong>${pkg.rating}/5.0</strong> (${pkg.reviews} reviews)</div>
        <div style="font-size:0.875rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Small groups (max 12)</div>
      </div>
    </div>
  `;

  // Itinerary tab
  document.getElementById('tab-itinerary').innerHTML = pkg.itinerary.map(day => `
    <div class="itinerary-day">
      <div class="itinerary-day-num">Day<span>${day.day}</span></div>
      <div class="itinerary-day-body">
        <div class="day-title">${day.title}</div>
        <ul class="day-activities">
          ${(day.activities || []).map(a=>`<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  // Includes tab
  document.getElementById('tab-includes').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div style="background:var(--white);border-radius:10px;padding:1.5rem;">
        <div style="font-size:0.8rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--forest);margin-bottom:1rem;">✓ What's Included</div>
        ${pkg.includes.map(i=>`<div style="display:flex;gap:8px;align-items:center;font-size:0.875rem;color:var(--ink-mid);margin-bottom:8px;"><span style="color:var(--forest);font-weight:700;">✓</span>${i}</div>`).join('')}
      </div>
      <div style="background:var(--white);border-radius:10px;padding:1.5rem;">
        <div style="font-size:0.8rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--terra);margin-bottom:1rem;">✗ Not Included</div>
        ${pkg.excludes.map(e=>`<div style="display:flex;gap:8px;align-items:center;font-size:0.875rem;color:var(--ink-mid);margin-bottom:8px;"><span style="color:var(--terra);font-weight:700;">✗</span>${e}</div>`).join('')}
      </div>
    </div>
  `;

  // Reviews tab
  document.getElementById('tab-reviews').innerHTML = `
    <div style="background:var(--white);border-radius:10px;padding:1.5rem;margin-bottom:1rem;">
      <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;">
        <div style="text-align:center;">
          <div style="font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:600;color:var(--terra);line-height:1;">${pkg.rating}</div>
          <div style="color:var(--gold);font-size:1rem;">${'★'.repeat(5)}</div>
          <div style="font-size:0.75rem;color:var(--warm-grey);">${pkg.reviews} reviews</div>
        </div>
        <div style="flex:1;">
          ${[5,4,3,2,1].map(n => {
            const pct = n===5?78:n===4?18:n===3?4:0;
            return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:0.75rem;"><span>${n}★</span><div style="flex:1;height:8px;background:var(--sand-dark);border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--gold);border-radius:4px;"></div></div><span style="color:var(--warm-grey);width:30px;">${pct}%</span></div>`;
          }).join('')}
        </div>
      </div>
      ${testimonials.map(t=>`
        <div style="border-bottom:1px solid var(--sand-dark);padding:1rem 0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:0.5rem;">
            <img src="${t.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
            <div>
              <div style="font-weight:600;font-size:0.875rem;">${t.author}</div>
              <div style="font-size:0.7rem;color:var(--warm-grey);">${t.trip}</div>
            </div>
            <div style="margin-left:auto;color:var(--gold);font-size:0.75rem;">${'★'.repeat(t.rating)}</div>
          </div>
          <p style="font-size:0.85rem;color:var(--ink-mid);line-height:1.6;font-style:italic;">"${t.text}"</p>
        </div>
      `).join('')}
    </div>
  `;

  // Sidebar
  document.getElementById('detail-sidebar').innerHTML = `
    <div class="sidebar-price">
      <div class="sidebar-price-label">Starting from</div>
      <div class="sidebar-price-amount">₹${(pkg.price*83).toLocaleString()}</div>
      <div class="sidebar-price-pp">per person</div>
    </div>
    <div class="booking-form">
      <div class="form-group">
        <label>Travel Date</label>
        <input type="date" id="sb-date">
      </div>
      <div class="form-group">
        <label>Travellers</label>
        <select id="sb-pax">
          <option>1 Person</option>
          <option selected>2 People</option>
          <option>3 People</option>
          <option>4 People</option>
          <option>5+ People</option>
        </select>
      </div>
      <button class="btn-book-now" onclick="startBooking()">Book This Package →</button>
      ${!WL.isLoggedIn() ? '<p style="font-size:0.72rem;color:var(--warm-grey);text-align:center;margin-top:0.5rem;">🔒 Sign in required to book</p>' : ''}
    </div>
    <div class="sidebar-includes">
      <h4>Key Inclusions</h4>
      ${pkg.includes.slice(0,5).map(i=>`<div class="include-item"><span>✓</span>${i}</div>`).join('')}
    </div>
  `;

  // Set default date
  const d = new Date(); d.setMonth(d.getMonth()+2);
  const sbDate = document.getElementById('sb-date');
  if (sbDate) sbDate.value = d.toISOString().split('T')[0];

  showPage('detail');
  // Reset to first tab
  document.querySelectorAll('.detail-tab').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-content').forEach((c,i) => c.classList.toggle('active', i===0));
}

function switchDetailTab(name, btn) {
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ═══════════════════════════════════════
//   BOOKING FLOW
// ═══════════════════════════════════════
// ═══════════════════════════════════════
//   TRIP DETAILS MODAL
// ═══════════════════════════════════════
let tdPaxCount = 2;
let tdTripType = 'oneway';

function openTdModal() {
  if (!WL.isLoggedIn()) { openModal('signin'); showToast('Please sign in to book a package', 'error'); return; }
  if (!currentPackage) return;
  const pkg = currentPackage;
  const intl = isInternational(pkg);

  document.getElementById('td-pkg-name').textContent = pkg.title;
  document.getElementById('td-pkg-meta').textContent = pkg.location + ' · ' + pkg.duration;

  const cities = intl
    ? ['Mumbai (BOM)', 'Delhi (DEL)', 'Bangalore (BLR)', 'Chennai (MAA)', 'Hyderabad (HYD)', 'Kolkata (CCU)', 'Pune (PNQ)', 'Ahmedabad (AMD)', 'Kochi (COK)']
    : ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Surat', 'Lucknow'];
  const sel = document.getElementById('td-origin');
  sel.innerHTML = '<option value="">— Select your departure city —</option>' +
    cities.map(c => '<option value="' + c + '">' + c + '</option>').join('');
  // Pre-select previously chosen origin if it matches this package type
  if (searchState.origin) {
    const matchOpt = [...sel.options].find(o => o.value.toLowerCase().startsWith(searchState.origin.split(' ')[0].toLowerCase()));
    if (matchOpt) sel.value = matchOpt.value;
  }

  const sbDate = document.getElementById('sb-date')?.value;
  const tdDepart = document.getElementById('td-depart');
  if (sbDate) {
    tdDepart.value = sbDate;
  } else {
    const def = new Date(); def.setMonth(def.getMonth() + 2);
    tdDepart.value = def.toISOString().split('T')[0];
  }
  tdDepart.min = new Date().toISOString().split('T')[0];

  // Pre-fill pax: prefer searchState, then sidebar picker
  if (searchState.pax) {
    tdPaxCount = Math.min(parseInt(searchState.pax) || 2, 10);
  } else {
    const sbPax = document.getElementById('sb-pax');
    if (sbPax) {
      const paxMap = { '1 Person': 1, '2 People': 2, '3 People': 3, '4 People': 4, '5+ People': 5 };
      tdPaxCount = paxMap[sbPax.value] || 2;
    } else {
      tdPaxCount = 2;
    }
  }
  document.getElementById('td-pax-num').textContent = tdPaxCount;
  document.getElementById('td-pax-minus').disabled = tdPaxCount <= 1;
  document.getElementById('td-pax-plus').disabled = tdPaxCount >= 10;

  // Restore previous trip type selection
  tdTripType = swTripType || 'oneway';
  document.getElementById('td-btn-oneway').classList.toggle('active', tdTripType === 'oneway');
  document.getElementById('td-btn-roundtrip').classList.toggle('active', tdTripType === 'roundtrip');
  const retGrp = document.getElementById('td-return-group');
  retGrp.classList.toggle('show', tdTripType === 'roundtrip');
  if (tdTripType === 'roundtrip' && searchState.returnDate) {
    document.getElementById('td-return').value = searchState.returnDate;
  }

  document.getElementById('td-origin-err').classList.remove('show');
  document.getElementById('td-depart-err').classList.remove('show');

  tdUpdatePrice();
  document.getElementById('td-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTdModal() {
  document.getElementById('td-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function tdCloseOnOverlay(e) {
  if (e.target === document.getElementById('td-modal')) closeTdModal();
}

function tdSetTripType(type) {
  tdTripType = type;
  document.getElementById('td-btn-oneway').classList.toggle('active', type === 'oneway');
  document.getElementById('td-btn-roundtrip').classList.toggle('active', type === 'roundtrip');
  const retGroup = document.getElementById('td-return-group');
  retGroup.classList.toggle('show', type === 'roundtrip');
  if (type === 'roundtrip') {
    const depVal = document.getElementById('td-depart').value;
    const retInp = document.getElementById('td-return');
    if (depVal) {
      const dep = new Date(depVal + 'T00:00:00');
      dep.setDate(dep.getDate() + (currentPackage?.days || 7));
      retInp.value = dep.toISOString().split('T')[0];
      retInp.min = depVal;
    }
  }
}

function tdAdjPax(delta) {
  tdPaxCount = Math.max(1, Math.min(10, tdPaxCount + delta));
  document.getElementById('td-pax-num').textContent = tdPaxCount;
  document.getElementById('td-pax-minus').disabled = tdPaxCount <= 1;
  document.getElementById('td-pax-plus').disabled = tdPaxCount >= 10;
  tdUpdatePrice();
}

function tdUpdatePrice() {
  if (!currentPackage) return;
  const base = Math.round(currentPackage.price * tdPaxCount * 83 * 1.18);
  document.getElementById('td-price-preview').textContent = '\u20b9' + base.toLocaleString();
  document.getElementById('td-price-pp').textContent = 'for ' + tdPaxCount + ' adult' + (tdPaxCount !== 1 ? 's' : '') + ' · incl. taxes';
}

function confirmTdAndBook() {
  const origin = document.getElementById('td-origin').value;
  const depart = document.getElementById('td-depart').value;
  let valid = true;
  if (!origin) { document.getElementById('td-origin-err').classList.add('show'); valid = false; }
  else { document.getElementById('td-origin-err').classList.remove('show'); }
  if (!depart) { document.getElementById('td-depart-err').classList.add('show'); valid = false; }
  else { document.getElementById('td-depart-err').classList.remove('show'); }
  if (!valid) return;

  searchState.origin = origin;
  searchState.date = depart;
  searchState.pax = String(tdPaxCount);
  swPaxCount = tdPaxCount;
  swTripType = tdTripType;
  searchState.returnDate = (tdTripType === 'roundtrip') ? (document.getElementById('td-return').value || null) : null;

  closeTdModal();
  proceedBooking();
}

function startBooking() {
  if (!WL.isLoggedIn()) { openModal(); return; }
  if (!currentPackage) return;
  // Always collect/confirm trip details for each package visit
  openTdModal();
}

function proceedBooking() {
  if (!WL.isLoggedIn()) { openModal(); return; }
  if (!currentPackage) return;

  const intl = isInternational(currentPackage);
  const cities = intl
    ? ['Mumbai (BOM)', 'Delhi (DEL)', 'Bangalore (BLR)', 'Chennai (MAA)', 'Hyderabad (HYD)', 'Kolkata (CCU)', 'Pune (PNQ)', 'Ahmedabad (AMD)', 'Kochi (COK)']
    : ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Surat', 'Lucknow'];

  let originVal = searchState.origin || '';
  if (!originVal) { originVal = cities[0]; }
  else {
    const match = cities.find(c => c.toLowerCase().startsWith(originVal.toLowerCase()));
    if (match) originVal = match;
  }
  const originHid = document.getElementById('bk-origin');
  if (originHid) originHid.value = originVal;
  const originDisp = document.getElementById('bk-origin-display');
  if (originDisp) originDisp.textContent = originVal || '—';

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear();
  }
  const dateHid = document.getElementById('bk-date');
  const dateDisp = document.getElementById('bk-date-display');
  let dateVal = searchState.date || '';
  if (!dateVal) { const def = new Date(); def.setMonth(def.getMonth()+2); dateVal = def.toISOString().split('T')[0]; }
  if (dateHid) dateHid.value = dateVal;
  if (dateDisp) dateDisp.textContent = fmtDate(dateVal);

  const retWrap = document.getElementById('bk-return-display-wrap');
  const retDisp = document.getElementById('bk-return-display');
  if (retWrap && retDisp) {
    if (swTripType === 'roundtrip' && searchState.returnDate) {
      retWrap.style.display = ''; retDisp.textContent = fmtDate(searchState.returnDate);
    } else if (swTripType === 'roundtrip') {
      retWrap.style.display = ''; retDisp.textContent = 'Not selected';
    } else {
      retWrap.style.display = 'none';
    }
  }

  if (searchState.pax) {
    const adultsEl = document.getElementById('bk-adults');
    if (adultsEl) { adultsEl.value = String(Math.min(parseInt(searchState.pax) || 2, 5)); }
  }

  populateBookingSummary();
  showPage('booking');
  nextStep(1, true);
  setTimeout(renderTravellerForms, 100);
}

function getBookingPax() {
  return parseInt(document.getElementById('bk-adults')?.value) || 2;
}

function populateBookingSummary() {
  const pkg = currentPackage;
  const pax = getBookingPax();
  const pkgBase = Math.round(pkg.price * pax * 83);          // package cost
  const txCost  = selectedTransport ? Math.round((selectedTransport.trainClassPrice || selectedTransport.price || 0) * pax) : 0;
  const subtotal = pkgBase + txCost;
  const tax     = Math.round(pkgBase * 0.18);                 // GST on package only
  const total   = subtotal + tax;

  // Step 1 booking summary card
  document.getElementById('bs-card-1').innerHTML = `
    <div class="bs-title">${pkg.title}</div>
    <div class="bs-meta"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${pkg.location} · ${pkg.duration}</div>
    <div class="bs-row"><span>Package (${pax} adult${pax!==1?'s':''})</span><span><strong>&#8377;${pkgBase.toLocaleString()}</strong></span></div>
    <div class="bs-row"><span>GST / Service fee (18%)</span><span><strong>&#8377;${tax.toLocaleString()}</strong></span></div>
    ${txCost ? `<div class="bs-row"><span>Transport (${pax} × &#8377;${((selectedTransport.trainClassPrice||selectedTransport.price||0)).toLocaleString()})</span><span><strong>&#8377;${txCost.toLocaleString()}</strong></span></div>` : ''}
    <div class="bs-total"><span>Total</span><span>&#8377;${total.toLocaleString()}</span></div>
  `;

  // Step 4 order summary card
  const txLabel = selectedTransport
    ? (selectedTransport.mode==='flight' ? `${selectedTransport.airline} ${selectedTransport.code} · ${selectedTransport.cls||'Economy'}`
      : selectedTransport.mode==='train' ? `${selectedTransport.name} · ${selectedTransport.trainClass || ''}`
      : `${selectedTransport.type}${selectedTransport.tier ? ' · ' + selectedTransport.tier : ''}`)
    : null;

  const discount = getDiscount(total);
  const finalTotal = total - discount;
  document.getElementById('booking-price-summary').innerHTML = `
    <h3>Order Summary</h3>
    <div style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem;">
      <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--warm-grey);padding-bottom:4px;border-bottom:1px solid var(--sand-dark);">Package</div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--ink-mid);">
        <span>${pkg.title} · ${pax} adult${pax!==1?'s':''}</span>
        <span style="color:var(--ink);font-weight:600;">&#8377;${pkgBase.toLocaleString()}</span>
      </div>
      ${txCost ? `
      <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--warm-grey);padding-bottom:4px;border-bottom:1px solid var(--sand-dark);margin-top:0.5rem;">Transport</div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--ink-mid);">
        <span>${txLabel} · ${pax} person${pax!==1?'s':''}</span>
        <span style="color:var(--ink);font-weight:600;">&#8377;${txCost.toLocaleString()}</span>
      </div>` : ''}
      <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--warm-grey);padding-bottom:4px;border-bottom:1px solid var(--sand-dark);margin-top:0.5rem;">Taxes &amp; Fees</div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--ink-mid);">
        <span>GST 18% (on package)</span>
        <span style="color:var(--ink);font-weight:600;">&#8377;${tax.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--ink-mid);">
        <span>Service fee</span>
        <span style="color:var(--forest);font-weight:600;">Included</span>
      </div>
    </div>
    ${discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--forest);font-weight:600;"><span>🏷️ Discount (${appliedCoupon?.code})</span><span>- &#8377;${discount.toLocaleString()}</span></div>` : ''}
    <div style="border-top:2px solid var(--sand-dark);padding-top:1rem;display:flex;justify-content:space-between;font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--ink);">
      <span>Grand Total</span><span style="color:var(--terra);">&#8377;${finalTotal.toLocaleString()}</span>
    </div>
    <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--warm-grey);text-align:right;">All prices in Indian Rupees (INR) · incl. taxes</div>
  `;
  const _cu = WL.getUser();
  if (_cu) {
    const emailField = document.getElementById('bk-email');
    if (emailField && _cu.email) emailField.value = _cu.email;
  }
}

function updateBookingSummary() {
  if (!currentPackage) return;
  populateBookingSummary();
  // Also refresh payment summary if already rendered
  const ps = document.getElementById('booking-price-summary');
  if (ps && ps.innerHTML) populateBookingSummary();
}

function goBackToStep(n) {
  // Only allow navigating back to a step that is already done
  const steps = document.querySelectorAll('.booking-step');
  const currentStep = [...steps].findIndex(s => s.classList.contains('active')) + 1;
  if (n < currentStep) nextStep(n);
}

function nextStep(n, reset) {
  document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.booking-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i+1 < n) s.classList.add('done');
    if (i+1 === n) s.classList.add('active');
  });
  document.getElementById('panel-' + n).classList.add('active');
  if (n === 2) renderTransportStep();
  if (n === 1) setTimeout(renderTravellerForms, 50);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════
//   TRANSPORT DATA
// ═══════════════════════════════════════
const transportData = {
  domestic: {
    available: ['flight','train','cab'],
    flights: [
      { id:'f1', airline:'IndiGo', code:'6E-423', emoji:'', departs:'06:15', arrives:'08:30', duration:'2h 15m', price:4200, cls:'Economy', stops:'Non-stop' },
      { id:'f2', airline:'Air India', code:'AI-102', emoji:'', departs:'09:00', arrives:'11:20', duration:'2h 20m', price:5800, cls:'Economy', stops:'Non-stop' },
      { id:'f3', airline:'SpiceJet', code:'SG-301', emoji:'', departs:'14:30', arrives:'16:50', duration:'2h 20m', price:3750, cls:'Economy', stops:'Non-stop' }
    ],
    trains: [
      { id:'t1', name:'Rajdhani Express', number:'12951', departs:'17:00', arrives:'08:15+1', duration:'15h 15m', days:'Mon Wed Fri Sun',
        classes:[{cls:'1AC',price:3200,label:'First AC',avail:'Avail'},{cls:'2AC',price:1950,label:'Second AC',avail:'Avail'},{cls:'3AC',price:1350,label:'Third AC',avail:'WL 12'},{cls:'SL',price:640,label:'Sleeper',avail:'Avail'}] },
      { id:'t2', name:'Duronto Express', number:'12223', departs:'22:55', arrives:'17:45+1', duration:'18h 50m', days:'Tue Thu Sat',
        classes:[{cls:'2AC',price:2100,label:'Second AC',avail:'Avail'},{cls:'3AC',price:1450,label:'Third AC',avail:'Avail'},{cls:'SL',price:680,label:'Sleeper',avail:'RAC 5'}] },
      { id:'t3', name:'Shatabdi Express', number:'12001', departs:'06:15', arrives:'14:00', duration:'7h 45m', days:'Daily except Sun',
        classes:[{cls:'EC',price:1850,label:'Executive Chair',avail:'Avail'},{cls:'CC',price:980,label:'AC Chair Car',avail:'Avail'}] },
      { id:'t4', name:'Jan Shatabdi', number:'12059', departs:'05:10', arrives:'12:45', duration:'7h 35m', days:'Daily',
        classes:[{cls:'CC',price:540,label:'AC Chair Car',avail:'Avail'},{cls:'2S',price:210,label:'Second Sitting',avail:'Avail'}] },
      { id:'t5', name:'Garib Rath Express', number:'12909', departs:'15:40', arrives:'07:30+1', duration:'15h 50m', days:'Wed Sat',
        classes:[{cls:'3AC',price:875,label:'Third AC',avail:'Avail'},{cls:'SL',price:480,label:'Sleeper',avail:'WL 28'}] }
    ],
    cabs: [
      { id:'c1', type:'Sedan', models:'Swift Dzire / Honda Amaze', capacity:'4 passengers', emoji:'<img src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=240&h=140&fit=crop&auto=format&q=90" alt="Sedan" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:2800, perKm:12, ac:true },
      { id:'c2', type:'SUV', models:'Toyota Innova Crysta', capacity:'6 passengers', emoji:'<img src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=240&h=140&fit=crop&auto=format&q=90" alt="SUV" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:3800, perKm:15, ac:true },
      { id:'c3', type:'XL / Traveller', models:'Force Traveller / Tempo', capacity:'12 passengers', emoji:'<img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=240&h=140&fit=crop&auto=format&q=90" alt="XL Van" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:5500, perKm:20, ac:true },
      { id:'c4', type:'Luxury Sedan', models:'Mercedes E-Class / BMW 5', capacity:'4 passengers', emoji:'<img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=240&h=140&fit=crop&auto=format&q=90" alt="Luxury Sedan" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:9500, perKm:38, ac:true }
    ]
  },
  international: {
    available: ['flight'],
    flights: [
      { id:'f1', airline:'Air India', code:'AI-301', emoji:'', departs:'02:15', arrives:'14:30', duration:'7h+', price:38000, cls:'Economy', stops:'Non-stop' },
      { id:'f2', airline:'Emirates', code:'EK-504', emoji:'', departs:'03:30', arrives:'16:45', duration:'8h via DXB', price:45000, cls:'Economy', stops:'1 stop' },
      { id:'f3', airline:'Singapore Airlines', code:'SQ-424', emoji:'', departs:'09:15', arrives:'22:30', duration:'8h via SIN', price:52000, cls:'Economy', stops:'1 stop' },
      { id:'f4', airline:'Qatar Airways', code:'QR-571', emoji:'', departs:'23:45', arrives:'12:00+1', duration:'9h via DOH', price:41000, cls:'Economy', stops:'1 stop' },
      { id:'f5', airline:'Lufthansa', code:'LH-761', emoji:'', departs:'06:30', arrives:'18:45', duration:'9h via FRA', price:48000, cls:'Economy', stops:'1 stop' },
      { id:'f6', airline:'Virgin Atlantic', code:'VS-302', emoji:'', departs:'14:00', arrives:'03:00+1', duration:'11h via LHR', price:55000, cls:'Economy', stops:'1 stop' }
    ],
    cabs: [
      { id:'c1', type:'Sedan', models:'Toyota Camry / Honda Accord', capacity:'4 passengers', emoji:'<img src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=240&h=140&fit=crop&auto=format&q=90" alt="Sedan" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:4500, perKm:18, ac:true },
      { id:'c2', type:'SUV', models:'Toyota Fortuner / Kia Sorento', capacity:'6 passengers', emoji:'<img src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=240&h=140&fit=crop&auto=format&q=90" alt="SUV" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:6800, perKm:22, ac:true },
      { id:'c3', type:'XL Van', models:'Mercedes Vito / Toyota Hiace', capacity:'8 passengers', emoji:'<img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=240&h=140&fit=crop&auto=format&q=90" alt="XL Van" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:9500, perKm:30, ac:true },
      { id:'c4', type:'Luxury', models:'Mercedes S-Class / BMW 7', capacity:'4 passengers', emoji:'<img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=240&h=140&fit=crop&auto=format&q=90" alt="Luxury Sedan" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">', price:16000, perKm:55, ac:true }
    ]
  }
};

// State
let selectedTransport = null; // { mode, option, trainClass (if train) }
let activeTransportMode = 'flight';
let _liveTransportData = null; // cached live data from last API call

function isInternational(pkg) {
  const domestic = ['india','goa','rajasthan','kerala','mumbai','delhi','bangalore'];
  return !domestic.some(d => pkg.location.toLowerCase().includes(d));
}

async function renderTransportStep() {
  const pkg = currentPackage;
  if (!pkg) return;

  const type = isInternational(pkg) ? 'international' : 'domestic';

  // Show route label
  const origin = document.getElementById('bk-origin')?.value || searchState.origin || 'Your City';
  const routeLabel = document.getElementById('transport-route-label');
  if (routeLabel) {
    routeLabel.innerHTML = `Route: <strong>${origin}</strong> → <strong>${pkg.location}</strong> &nbsp;·&nbsp; All prices are per person one-way.`;
  }

  // Fetch live transport data from DB
  let data = { flights: [], trains: [], cabs: [] };
  try {
    const res = await WL.getTransport(type);
    if (res.success && res.data) {
      data = res.data;
      // Normalize fields to match UI expectations
      data.flights = (data.flights || []).map(f => ({
        id: 'f' + f.id, airline: f.provider, code: f.code,
        departs: f.departs, arrives: f.arrives, duration: f.duration,
        price: f.price, cls: f.class, stops: f.stops
      }));
      data.trains = (data.trains || []).map(t => ({
        id: 't' + t.id, name: t.provider, number: t.code,
        departs: t.departs, arrives: t.arrives, duration: t.duration,
        classes: [{ cls: t.class, price: t.price, label: t.class, avail: 'Avail' }]
      }));
      data.cabs = (data.cabs || []).map(c => ({
        id: 'c' + c.id, type: c.provider, models: c.code,
        capacity: String(c.stops) + ' passengers', price: c.price,
        ac: c.class === 'AC',
        emoji: `<img src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=240&h=140&fit=crop&auto=format&q=90" alt="${c.provider}" style="width:80px;height:50px;object-fit:cover;border-radius:8px;display:block;">`
      }));
    }
  } catch (e) {
    console.warn('Transport API failed, using cached data:', e.message);
    // Fallback to hardcoded data
    const cached = type === 'international' ? transportData.international : transportData.domestic;
    data = { flights: cached.flights || [], trains: cached.trains || [], cabs: cached.cabs || [] };
  }

  // Determine available modes
  const availableModes = [];
  if (data.flights?.length) availableModes.push('flight');
  if (data.trains?.length)  availableModes.push('train');
  if (data.cabs?.length)    availableModes.push('cab');
  if (!availableModes.includes(activeTransportMode)) activeTransportMode = availableModes[0] || 'flight';

  // Render mode tabs
  const modes = [
    { key:'flight', icon:'<img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=160&h=100&fit=crop&auto=format&q=90" alt="Flight" style="width:52px;height:34px;object-fit:cover;border-radius:6px;display:block;margin:0 auto;">', label:'Flight' },
    { key:'train',  icon:'<img src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=160&h=100&fit=crop&auto=format&q=90" alt="Train" style="width:52px;height:34px;object-fit:cover;border-radius:6px;display:block;margin:0 auto;">', label:'Train'  },
    { key:'cab',    icon:'<img src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=160&h=100&fit=crop&auto=format&q=90" alt="Cab" style="width:52px;height:34px;object-fit:cover;border-radius:6px;display:block;margin:0 auto;">', label:'Cab'    }
  ];
  document.getElementById('transport-tabs').innerHTML = modes
    .filter(m => availableModes.includes(m.key))
    .map(m => `<button class="transport-tab${activeTransportMode===m.key?' active':''}"
      onclick="switchTransportMode('${m.key}')">
      <span class="tab-icon">${m.icon}</span>${m.label}
    </button>`).join('');

  // Render each section
  _liveTransportData = data; // cache for use by select functions
  renderFlights(data.flights || []);
  renderTrains(data.trains || []);
  renderCabs(data.cabs || []);

  // Show only available sections, hide others
  ['flight','train','cab'].forEach(m => {
    const sec = document.getElementById('ts-' + m);
    if (sec) sec.classList.toggle('active', false);
  });
  const firstAvail = data.available[0];
  activeTransportMode = firstAvail;
  const firstSec = document.getElementById('ts-' + firstAvail);
  if (firstSec) firstSec.classList.add('active');

  // Also hide transport sections for unavailable modes entirely
  ['flight','train','cab'].forEach(m => {
    const sec = document.getElementById('ts-' + m);
    if (sec) sec.style.display = data.available.includes(m) ? '' : 'none';
  });

  // Re-highlight active tab
  document.querySelectorAll('.transport-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.trim().toLowerCase().includes(firstAvail));
  });
}

function switchTransportMode(mode) {
  activeTransportMode = mode;
  document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.querySelectorAll('.transport-section').forEach(s => s.classList.remove('active'));
  document.getElementById('ts-' + mode).classList.add('active');
}

// Airline logos — real airline logos via Google Flights CDN (gstatic.com)
// IATA code mapped to official square logos used in Google Flights
const airlineIATA = {
  'IndiGo':             '6E',
  'Air India':          'AI',
  'Air India Express':  'IX',
  'SpiceJet':           'SG',
  'Emirates':           'EK',
  'Singapore Airlines': 'SQ',
  'Qatar Airways':      'QR',
  'Lufthansa':          'LH',
  'Virgin Atlantic':    'VS',
  'Air India Business': 'AI',
  'British Airways':    'BA',
  'Etihad Airways':     'EY',
  'Thai Airways':       'TG',
  'KLM':                'KL',
  'Air France':         'AF',
  'Vistara':            'UK',
  'GoFirst':            'G8',
  'AirAsia India':      'I5',
};

// Accent colours for the logo container background (used if img not loaded yet)
const airlineBg = {
  'IndiGo': '#1b0faa', 'Air India': '#b22234', 'Air India Express': '#e4002b',
  'SpiceJet': '#e8261c', 'Emirates': '#d71921', 'Singapore Airlines': '#003b70',
  'Qatar Airways': '#5c0632', 'Lufthansa': '#05164d', 'Virgin Atlantic': '#e10a0a',
  'Air India Business': '#b22234',
};

function makeLogoEl(airline) {
  const iata = airlineIATA[airline] || airline.slice(0,2).toUpperCase();
  const bg   = airlineBg[airline] || '#334466';
  const src  = `https://www.gstatic.com/flights/airline_logos/70px/${iata}.png`;
  // 2× hi-res fallback
  const src2 = `https://www.gstatic.com/flights/airline_logos/70px/dark/${iata}.png`;
  return `<div style="width:90px;height:52px;border-radius:10px;
    background:transparent;display:flex;align-items:center;justify-content:center;
    overflow:hidden;flex-shrink:0;">
    <img src="${src}"
      onerror="this.onerror=null;this.src='${src2}';this.onerror=function(){this.style.display='none';this.nextSibling.style.display='flex';}"
      style="width:64px;height:64px;object-fit:contain;display:block;"
      alt="${airline}">
    <div style="display:none;width:100%;height:100%;background:${bg};border-radius:9px;
      align-items:center;justify-content:center;flex-direction:column;">
      <span style="font-family:Arial Black,sans-serif;font-weight:900;font-size:16px;
        color:#fff;letter-spacing:-0.5px;">${iata}</span>
    </div>
  </div>`;
}

// Keep airlineLogos for backwards compat — now delegates to makeLogoEl
const airlineLogos = new Proxy({}, { get: (_, k) => makeLogoEl(k) });

function getAirlineLogoEl(airline) {
  return makeLogoEl(airline);
}

// Per-flight class options
function getFlightClasses(f) {
  const base = f.price;
  return [
    { cls:'Economy',  price: base,                    badge:'eco',   label:'Economy'  },
    { cls:'Business', price: Math.round(base * 2.8),  badge:'biz',   label:'Business' },
    { cls:'First',    price: Math.round(base * 5.2),  badge:'first', label:'First'    }
  ];
}

function renderFlights(flights) {
  document.getElementById('flight-options').innerHTML = flights.map(f => {
    const isSelected = selectedTransport && selectedTransport.id === f.id;
    const selectedCls = isSelected ? (selectedTransport.cls || 'Economy') : null;
    const classes = getFlightClasses(f);
    return `
    <div class="transport-card${isSelected?' selected':''}" id="tc-${f.id}">
      <div class="tc-header" style="cursor:default;">
        <div class="tc-logo">${getAirlineLogoEl(f.airline)}</div>
        <div>
          <div class="tc-name">${f.airline}</div>
          <div class="tc-code">${f.code} · ${f.stops}</div>
        </div>
        <div style="margin-left:1rem;display:flex;gap:1.5rem;align-items:center;flex:1;justify-content:center;">
          <div style="text-align:center;"><div style="font-weight:600;font-size:1rem;">${f.departs}</div><div style="font-size:0.7rem;color:var(--warm-grey);">Departs</div></div>
          <div style="font-size:0.75rem;color:var(--warm-grey);text-align:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5c-1.5-1.5-3.5-1.5-5 0L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 1.5 1.5 2 2L8 19l1-1v-3l3-2 3.5 6.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg><br>${f.duration}</div>
          <div style="text-align:center;"><div style="font-weight:600;font-size:1rem;">${f.arrives}</div><div style="font-size:0.7rem;color:var(--warm-grey);">Arrives</div></div>
        </div>
        <div class="tc-price">
          <div class="tc-price-amt">₹${(selectedCls ? classes.find(c=>c.cls===selectedCls)?.price||f.price : f.price).toLocaleString()}</div>
          <div class="tc-price-lbl">per person</div>
        </div>
      </div>
      <div class="flight-class-row">
        ${classes.map(c => `
          <div class="flt-cls-chip${isSelected && selectedCls===c.cls?' selected':''}"
               onclick="selectFlightClass('${f.id}', '${c.cls}', ${c.price}, ${JSON.stringify(f).replace(/"/g,'&quot;')})">
            <span class="fcc-label">${c.label}</span>
            <span class="fcc-price">₹${c.price.toLocaleString()}</span>
            <span class="fcc-type fcc-${c.badge}">${c.cls === 'Economy' ? '✈ Std' : c.cls === 'Business' ? '✦ Biz' : '★ First'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `}).join('');
}

function selectFlightClass(flightId, cls, price, flightData) {
  selectedTransport = { mode: 'flight', ...flightData, cls, price };
  const data = _liveTransportData || (isInternational(currentPackage) ? transportData.international : transportData.domestic);
  renderFlights(data.flights || []);
  populateBookingSummary();
}

function renderTrains(trains) {
  if (!trains || !trains.length) { document.getElementById('train-options').innerHTML = '<p style="color:var(--warm-grey);">No direct trains available for this destination.</p>'; return; }
  document.getElementById('train-options').innerHTML = trains.map(t => {
    const isSelected = selectedTransport && selectedTransport.id === t.id;
    return `
    <div class="transport-card${isSelected?' selected':''}" id="tc-${t.id}" onclick="selectTransport('train',${JSON.stringify(t).replace(/"/g,'&quot;')})">
      <div class="tc-header">
        <div class="tc-logo"><img src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=240&h=140&fit=crop&auto=format&q=90" alt="Train" style="width:64px;height:44px;object-fit:cover;border-radius:8px;display:block;"></div>
        <div>
          <div class="tc-name">${t.name}</div>
          <div class="tc-code">#${t.number} · ${t.days}</div>
        </div>
        <div style="margin-left:1rem;display:flex;gap:1.5rem;align-items:center;flex:1;justify-content:center;">
          <div style="text-align:center;"><div style="font-weight:600;font-size:1rem;">${t.departs}</div><div style="font-size:0.7rem;color:var(--warm-grey);">Departs</div></div>
          <div style="font-size:0.75rem;color:var(--warm-grey);text-align:center;"><img src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=80&h=48&fit=crop&auto=format&q=90" alt="Train" style="width:36px;height:22px;object-fit:cover;border-radius:4px;display:inline-block;vertical-align:middle;"><br>${t.duration}</div>
          <div style="text-align:center;"><div style="font-weight:600;font-size:1rem;">${t.arrives}</div><div style="font-size:0.7rem;color:var(--warm-grey);">Arrives</div></div>
        </div>
        <div class="tc-price">
          <div class="tc-price-amt">₹${Math.min(...t.classes.map(c=>c.price)).toLocaleString()}+</div>
          <div class="tc-price-lbl">from / person</div>
        </div>
      </div>
      <div class="train-classes">
        <div style="width:100%;font-size:0.75rem;font-weight:600;color:var(--warm-grey);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">Select Class</div>
        ${t.classes.map(c => {
          const isCls = selectedTransport && selectedTransport.id===t.id && selectedTransport.trainClass===c.cls;
          return `<div class="class-chip${isCls?' selected':''}" onclick="selectTrainClass(event,'${t.id}','${c.cls}',${c.price})">
            ${c.cls}<small>${c.label} · ₹${c.price.toLocaleString()}</small>
            <small style="color:${c.avail.startsWith('WL')||c.avail.startsWith('RAC')?'var(--terra)':'var(--forest)'};">${c.avail}</small>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderCabs(cabs) {
  document.getElementById('cab-options').innerHTML = cabs.map(c => {
    const isSelected = selectedTransport && selectedTransport.id === c.id;
    const selectedTier = isSelected ? (selectedTransport.tier || 'Standard') : null;
    const tiers = [
      { tier: 'Standard', multiplier: 1,    label: 'Std', desc: 'Shared shuttle style' },
      { tier: 'Comfort',  multiplier: 1.45, label: '★ Comfort', desc: 'Solo cab, cleaner' },
      { tier: 'Premium',  multiplier: 2.1,  label: '✦ Premium', desc: 'Top-rated driver' }
    ];
    return `
    <div class="transport-card${isSelected?' selected':''}" id="tc-${c.id}">
      <div class="tc-header" style="cursor:default;">
        <div class="tc-logo" style="line-height:0;">${c.emoji}</div>
        <div>
          <div class="tc-name">${c.type}</div>
          <div class="tc-code">${c.models}</div>
        </div>
        <div class="tc-price">
          <div class="tc-price-amt">₹${(isSelected ? Math.round(c.price * (tiers.find(t=>t.tier===selectedTier)?.multiplier||1)) : c.price).toLocaleString()}</div>
          <div class="tc-price-lbl">base fare</div>
        </div>
      </div>
      <div class="tc-details">
        <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${c.capacity}</span>
        <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg> ₹${c.perKm}/km</span>
        <span class="tc-badge tc-badge-ac"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M20 16l-4-4 4-4"/><path d="M4 8l4 4-4 4"/><path d="M16 4l-4 4-4-4"/><path d="M8 20l4-4 4 4"/></svg> AC</span>
      </div>
      <div class="cab-tier-row">
        ${tiers.map(t => {
          const tierPrice = Math.round(c.price * t.multiplier);
          return `<div class="cab-tier-chip${isSelected && selectedTier===t.tier?' selected':''}"
            onclick="selectCabTier('${c.id}','${t.tier}',${tierPrice},${JSON.stringify(c).replace(/"/g,'&quot;')})">
            <span class="ctc-label">${t.label}</span>
            <span class="ctc-price">₹${tierPrice.toLocaleString()}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `}).join('');
}

function selectCabTier(cabId, tier, price, cabData) {
  selectedTransport = { mode: 'cab', ...cabData, tier, price };
  const data = _liveTransportData || (isInternational(currentPackage) ? transportData.international : transportData.domestic);
  renderCabs(data.cabs || []);
  populateBookingSummary();
}

function selectTransport(mode, option) {
  // Only used for trains now; flights use selectFlightClass, cabs use selectCabTier
  selectedTransport = { mode, ...option };
  const data = _liveTransportData || (isInternational(currentPackage) ? transportData.international : transportData.domestic);
  if (mode === 'train') renderTrains(data.trains || []);
  populateBookingSummary();
}

function selectTrainClass(e, trainId, cls, price) {
  e.stopPropagation();
  if (!selectedTransport || selectedTransport.id !== trainId) return;
  selectedTransport.trainClass = cls;
  selectedTransport.trainClassPrice = price;
  // Re-render trains to reflect class selection
  const data = _liveTransportData || (isInternational(currentPackage) ? transportData.international : transportData.domestic);
  renderTrains(data.trains || []);
}

function confirmTransport() {
  nextStep(3);
}

function skipTransport() {
  selectedTransport = null;
  nextStep(3);
}

// ═══════════════════════════════════════
// ═══════════════════════════════════════
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
  
  // confirmBooking is defined in bookings.js and handles the real API call
  addToMyTrips();
}

// Fallback logic — delegates to real confirmBooking if available, otherwise calls API directly
async function addToMyTrips() {
  if (typeof window.confirmBooking === 'function') {
    window.confirmBooking();
    return;
  }
  if (!currentPackage) return;
  if (!WL.isLoggedIn()) { openModal(); showToast('Please sign in to book'); return; }

  const pkg    = currentPackage;
  const dateVal = document.getElementById('bk-date')?.value;
  const pax    = getBookingPax();
  const coupon = document.getElementById('coupon-input')?.value?.trim() || document.getElementById('bk-coupon')?.value?.trim();

  const tx = selectedTransport;
  let transport_mode = 'none', transport_detail = null, transport_price = 0;
  if (tx) {
    transport_mode = tx.mode;
    transport_price = Math.round(tx.trainClassPrice || tx.price || 0);
    if (tx.mode === 'flight')
      transport_detail = `${tx.airline||tx.provider} ${tx.code} · ${tx.cls||'Economy'} · Departs ${tx.departs}`;
    else if (tx.mode === 'train')
      transport_detail = `${tx.name||tx.provider} #${tx.number||tx.code}${tx.trainClass?' · '+tx.trainClass:''} · Departs ${tx.departs}`;
    else
      transport_detail = `${tx.type||tx.provider} · ${tx.models||tx.code}${tx.tier?' · '+tx.tier:''}`;
  }

  try {
    const res = await WL.createBooking({
      pkg_id: pkg.id, adults: pax, departure_date: dateVal,
      coupon_code: coupon || undefined,
      travellers: [{ first_name: WL.getUser()?.first_name || 'Guest', last_name: WL.getUser()?.last_name || '' }],
      transport_mode, transport_detail, transport_price,
      lead_name: `${WL.getUser()?.first_name||''} ${WL.getUser()?.last_name||''}`.trim(),
      lead_email: WL.getUser()?.email || null,
      lead_phone: document.getElementById('tv1-phone')?.value || null
    });
    selectedTransport = null;
    if (typeof window.renderTrips === 'function') window.renderTrips();
    showToast('✓ Booking confirmed! Ref: ' + res.booking_ref);
    const refEl = document.getElementById('booking-ref');
    if (refEl) refEl.textContent = res.booking_ref;

    // Auto-record payment + generate invoice (card from step 4)
    try {
      const cardNum = document.querySelector('#panel-4 input[placeholder="4242 4242 4242 4242"]');
      const cardName = document.querySelector('#panel-4 input[placeholder="PRIYA SHARMA"]');
      const last4 = cardNum?.value?.replace(/\s/g,'').slice(-4) || null;
      await WL.createPayment(
        res.booking_id,
        'card',
        last4,
        'Visa'
      );
    } catch(payErr) {
      console.warn('Payment recording failed (non-critical):', payErr.message);
    }

    nextStep(5);
  } catch (err) {
    showToast(err.message || 'Booking failed. Please try again.', 'error');
  }
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
            leadName:  apiTrip.lead_name,
            leadEmail: apiTrip.lead_email,
            leadPhone: apiTrip.lead_phone,
            transport: apiTrip.transport_mode && apiTrip.transport_mode !== 'none' ? {
              mode:   apiTrip.transport_mode,
              detail: apiTrip.transport_detail,
              price:  apiTrip.transport_price
            } : null,
            pkg: {
              title:    apiTrip.pkg_title,
              image:    apiTrip.pkg_image,
              location: apiTrip.pkg_location,
              duration: apiTrip.pkg_duration,
              price:    apiTrip.pkg_price || 0
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
        if (t.transport && t.transport.mode && t.transport.mode !== 'none') {
          txSec.style.display = '';
          const mode = t.transport.mode;
          setEl('bd-tx-mode', mode.charAt(0).toUpperCase() + mode.slice(1));
          // Use stored detail string if available (from API), else build from fields
          const detail = t.transport.detail ||
            (mode === 'flight'
              ? `${t.transport.airline||''} ${t.transport.code||''} · ${t.transport.cls||'Economy'} class · Departs ${t.transport.departs||''}`
              : mode === 'train'
              ? `${t.transport.name||''} #${t.transport.number||t.transport.code||''}${t.transport.trainClass?' · '+t.transport.trainClass:''} · Departs ${t.transport.departs||''}`
              : `${t.transport.type||''} · ${t.transport.models||''}${t.transport.tier?' · '+t.transport.tier:''}`);
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
  if (!_detailTrip) { showToast('No booking selected.', 'error'); return; }
  const bookingId = _detailTrip.booking_id || _detailTrip.id;
  if (!bookingId) { showToast('✓ Invoice downloaded!'); return; }

  WL.getInvoiceByBooking(bookingId).then(({ invoice }) => {
    // Build a simple printable invoice
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Invoice ${invoice.invoice_number}</title>
      <style>
        body{font-family:sans-serif;padding:40px;color:#333;max-width:720px;margin:auto}
        h1{color:#c4622d;} table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f0eb}
        .total{font-weight:bold;font-size:1.1em} .footer{margin-top:32px;font-size:0.8em;color:#888}
      </style></head><body>
      <h1>🌍 Wanderlux — Invoice</h1>
      <p><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
      <p><strong>Booking Ref:</strong> ${invoice.booking_ref}</p>
      <p><strong>Issued:</strong> ${new Date(invoice.issued_at).toLocaleDateString()}</p>
      <p><strong>Package:</strong> ${invoice.pkg_title} — ${invoice.pkg_location}</p>
      <p><strong>Travel Date:</strong> ${invoice.travel_date ? new Date(invoice.travel_date).toLocaleDateString() : 'TBC'}</p>
      <p><strong>Traveller:</strong> ${invoice.first_name || ''} ${invoice.last_name || ''}</p>
      <table>
        <tr><th>Item</th><th>Amount (INR)</th></tr>
        <tr><td>Package Cost</td><td>₹${Number(invoice.subtotal - (invoice.transport_cost||0)).toLocaleString()}</td></tr>
        ${invoice.transport_cost ? `<tr><td>Transport (${invoice.transport_mode})</td><td>₹${Number(invoice.transport_cost).toLocaleString()}</td></tr>` : ''}
        <tr><td>GST (18%)</td><td>₹${Number(invoice.gst_amount).toLocaleString()}</td></tr>
        ${invoice.discount_amount ? `<tr><td>Discount / Coupon</td><td>-₹${Number(invoice.discount_amount).toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td><strong>Total Paid</strong></td><td><strong>₹${Number(invoice.total_amount).toLocaleString()}</strong></td></tr>
      </table>
      <div class="footer">This is a computer-generated invoice. For queries: support@wanderlux.com · +91 98765 00000</div>
      </body></html>`);
    w.document.close();
    w.print();
  }).catch(() => {
    showToast('✓ Invoice downloaded!');
  });
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
