const db = require('better-sqlite3')('F:\\Data Engineering\\GST-WEBSITE-main\\data.sqlite');
const query = process.argv.slice(2).join(' ');
if (!query) { console.log('Usage: node query.js "SELECT * FROM main_html"'); db.close(); process.exit(); }
try { console.log(db.prepare(query).all()); } catch(e) { console.log('Error:', e.message); }
db.close();
