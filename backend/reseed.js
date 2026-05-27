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
    const file = path.join(__dirname, '../database/wanderlux_complete.sql');
    console.log(`Executing ${file}...`);
    
    // Read the file
    let sql = fs.readFileSync(file, 'utf8');
    
// We need to drop the database if it exists, to ensure a clean slate
    await connection.query('DROP DATABASE IF EXISTS wanderlux_db;');
    
    // Strip BOM if present
    sql = sql.replace(/^\uFEFF/, '');
    
    // The script wanderlux_complete.sql already has create database inside it, 
    // but just in case, we can split it.
    
    // We must handle DELIMITER $$ manually because mysql2 doesn't support it
    const parts = sql.split('DELIMITER $$');
    
    console.log("Executing standard schema and data...");
    await connection.query(parts[0]);
    
    // Ensure we are using wanderlux_db for triggers
    await connection.query('USE wanderlux_db;');
    
    // The subsequent parts are triggers/functions
    for (let i = 1; i < parts.length; i++) {
        let block = parts[i];
        // Remove the DELIMITER ; at the end
        block = block.split('DELIMITER ;')[0];
        
        // Split by $$ to get individual functions/triggers
        const statements = block.split('$$').filter(s => s.trim().length > 0);
        
        for (const stmt of statements) {
            if (stmt.trim()) {
                console.log("Executing trigger/function block...");
                await connection.query(stmt);
            }
        }
    }
    
    console.log(`Successfully imported wanderlux_complete.sql!`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await connection.end();
  }
}

runSeed();
