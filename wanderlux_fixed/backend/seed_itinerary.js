const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    const file = path.join(__dirname, '../database/04_seed_full_itinerary.sql');
    console.log(`Executing ${file}...`);
    const sql = fs.readFileSync(file, 'utf8');
    await connection.query(sql);
    console.log(`Successfully imported all full itinerary days!`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await connection.end();
  }
}

runSeed();
