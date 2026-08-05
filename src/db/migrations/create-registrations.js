const Database = require('better-sqlite3');

const db = new Database('data.sqlite');
db.pragma('journal_mode = WAL');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS [registrations] (
            [application_id] INTEGER PRIMARY KEY AUTOINCREMENT,
            [session_id] TEXT UNIQUE,
            [created_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
            [updated_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
            [status] TEXT DEFAULT 'draft',
            [current_step] TEXT DEFAULT 'main_html'
        )
    `);
    console.log('registrations table created');
} catch(e) {
    console.log('Error creating registrations:', e.message);
}

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('All tables:', tables.map(t => t.name).join(', '));

db.close();
