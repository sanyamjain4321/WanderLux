const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../wanderlux/js/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Use a regex or simple eval to extract the 'packages' array
// The file has: const packages = [ ... ];
const pkgStart = appJsContent.indexOf('const packages = [');
const packagesMatch = appJsContent.substring(pkgStart);
// Strip out everything after the packages array (like destinations)
const nextConst = packagesMatch.indexOf('const destinations =');
let packagesStr = packagesMatch.substring(0, nextConst).trim();
if (packagesStr.endsWith(';')) packagesStr = packagesStr.slice(0, -1);

packagesStr = packagesStr.replace('const packages = ', '');

// Because the JS might have unquoted keys or comments, using eval is easiest here
let packages;
try {
  packages = eval('(' + packagesStr + ')');
} catch (e) {
  console.error("Failed to parse packages:", e);
  process.exit(1);
}

let sql = "USE wanderlux_db;\n\n";
sql += "DELETE FROM package_itinerary;\n\n";
sql += "INSERT INTO package_itinerary (pkg_id, day_number, day_title, activities_text) VALUES\n";

const values = [];
for (const pkg of packages) {
  // Fix pkg id matching what was inserted into DB.
  // Wait, in my previous seed script, I inserted all 21 packages with IDs 1 to 21.
  // The app.js has packages with ID 1 to 21? Let's check the length.
  
  if (!pkg.itinerary || !pkg.itinerary.length) continue;
  
  // Need to map the frontend ID to the database ID.
  // Actually, my 02_seed_core.sql explicitly mapped pkg_id to their original IDs, 
  // except where I fixed the duplicate ID 10 to 21. Let's just use pkg.id.
  let pkgId = pkg.id;
  if (pkg.title === 'Ladakh High Altitude Adventure') pkgId = 21; // Previously this was ID 10 duplicate
  
  for (const day of pkg.itinerary) {
    const title = day.title.replace(/'/g, "''");
    const activities = day.activities.join('|').replace(/'/g, "''");
    values.push(`(${pkgId}, ${day.day}, '${title}', '${activities}')`);
  }
}

sql += values.join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, 'database/04_seed_full_itinerary.sql'), sql);
console.log('Successfully generated 04_seed_full_itinerary.sql with ' + values.length + ' itinerary days.');
