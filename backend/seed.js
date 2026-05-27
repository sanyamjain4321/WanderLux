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
    const dbDir = path.join(__dirname, '../database');
    const files = ['01_schema.sql', '02_seed_core.sql', '03_seed_details.sql'];
    
    for (const file of files) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(path.join(dbDir, file), 'utf8');
      await connection.query(sql);
      console.log(`${file} completed successfully.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await connection.end();
  }
}

runSeed();
