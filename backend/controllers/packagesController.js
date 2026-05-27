// ═══════════════════════════════════════════════════════════
// controllers/packagesController.js — Package CRUD
// ═══════════════════════════════════════════════════════════

const db = require('../config/db');

// ─── GET /api/packages ────────────────────────────────────
const getAllPackages = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let sql = `SELECT id, title, location, duration, days,
                      price_usd, rating, reviews, badge, badge_label, image_url, description
               FROM packages WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (title LIKE ? OR location LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }
    // Note: Category filtering is complex without JOINs, omitting for brevity or we can add it later if needed.

    if (sort === 'price-asc') sql += ` ORDER BY price_usd ASC`;
    else if (sort === 'price-desc') sql += ` ORDER BY price_usd DESC`;
    else if (sort === 'rating') sql += ` ORDER BY rating DESC`;
    else if (sort === 'duration') sql += ` ORDER BY days ASC`;
    else sql += ` ORDER BY id ASC`;

    const [packages] = await db.query(sql, params);

    // Fetch highlights and categories for all packages
    const pkgIds = packages.map(p => p.id);
    let highlightsMap = {};
    let categoriesMap = {};
    if (pkgIds.length) {
      const [highlights] = await db.query(
        `SELECT package_id, highlight FROM package_highlights WHERE package_id IN (?)`, [pkgIds]
      );
      highlights.forEach(h => {
        if (!highlightsMap[h.package_id]) highlightsMap[h.package_id] = [];
        highlightsMap[h.package_id].push(h.highlight);
      });

      const [categories] = await db.query(
        `SELECT package_id, category FROM package_categories WHERE package_id IN (?)`, [pkgIds]
      );
      categories.forEach(c => {
        if (!categoriesMap[c.package_id]) categoriesMap[c.package_id] = [];
        categoriesMap[c.package_id].push(c.category);
      });
    }

    // Normalize response shape to match frontend expectations
    const data = packages.map(p => ({
      id: p.id,
      title: p.title,
      location: p.location,
      duration: p.duration,
      days: p.days,
      price: parseFloat(p.price_usd),
      rating: parseFloat(p.rating),
      reviews: p.reviews,
      badge: p.badge,
      badgeLabel: p.badge_label || p.badge,
      category: categoriesMap[p.id] || [],
      image: p.image_url,
      description: p.description,
      highlights: highlightsMap[p.id] || []
    }));

    if (category && category !== 'all') {
        const filteredData = data.filter(p => p.category.includes(category));
        return res.json({ success: true, data: filteredData, packages: filteredData });
    }

    res.json({ success: true, data, packages: data });
  } catch (error) {
    console.error('getAllPackages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch packages.' });
  }
};

// ─── GET /api/packages/:id ────────────────────────────────
const getPackageById = async (req, res) => {
  try {
    const [[pkg]] = await db.query(
      `SELECT id, title, location, duration, days,
              price_usd, rating, reviews, badge, badge_label, image_url, description
       FROM packages WHERE id = ?`, [req.params.id]
    );
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const [highlights] = await db.query(`SELECT highlight FROM package_highlights WHERE package_id = ? ORDER BY sort_order`, [pkg.id]);
    const [includes] = await db.query(`SELECT item FROM package_includes WHERE package_id = ?`, [pkg.id]);
    const [excludes] = await db.query(`SELECT item FROM package_excludes WHERE package_id = ?`, [pkg.id]);
    const [itinerary] = await db.query(
      `SELECT id, day_number, day_title FROM package_itinerary WHERE package_id = ? ORDER BY day_number`, [pkg.id]
    );
    
    // Fetch activities for itinerary
    const itinIds = itinerary.map(i => i.id);
    let activitiesMap = {};
    if (itinIds.length > 0) {
        const [activities] = await db.query(`SELECT itinerary_id, activity FROM itinerary_activities WHERE itinerary_id IN (?) ORDER BY sort_order`, [itinIds]);
        activities.forEach(a => {
            if (!activitiesMap[a.itinerary_id]) activitiesMap[a.itinerary_id] = [];
            activitiesMap[a.itinerary_id].push(a.activity);
        });
    }

    const [categories] = await db.query(`SELECT category FROM package_categories WHERE package_id = ?`, [pkg.id]);

    const data = {
      id: pkg.id,
      title: pkg.title,
      location: pkg.location,
      duration: pkg.duration,
      days: pkg.days,
      price: parseFloat(pkg.price_usd),
      rating: parseFloat(pkg.rating),
      reviews: pkg.reviews,
      badge: pkg.badge,
      badgeLabel: pkg.badge_label || pkg.badge,
      category: categories.map(c => c.category),
      image: pkg.image_url,
      description: pkg.description,
      highlights: highlights.map(h => h.highlight),
      includes: includes.map(i => i.item),
      excludes: excludes.map(e => e.item),
      itinerary: itinerary.map(d => ({
        day: d.day_number,
        title: d.day_title,
        activities: activitiesMap[d.id] || []
      }))
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('getPackageById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch package.' });
  }
};

module.exports = { getAllPackages, getPackageById };