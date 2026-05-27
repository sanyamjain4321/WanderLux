// ═══════════════════════════════════════════════════════════
// config/db.js — MySQL Connection Pool
// ═══════════════════════════════════════════════════════════

const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool (better than a single connection for web apps)
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'wanderlux_db',
  waitForConnections: true,
  connectionLimit:    10,       // max 10 concurrent connections
  queueLimit:         0,
  charset:            'utf8mb4' // support emojis
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('   → Make sure MySQL is running and .env is correct\n');
  } else {
    console.log('✅ MySQL connected successfully');
    connection.release();
  }
});

// Export promise-based pool for async/await
module.exports = pool.promise();
