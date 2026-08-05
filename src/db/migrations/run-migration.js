const Database = require('better-sqlite3');

const db = new Database('data.sqlite');
db.pragma('journal_mode = WAL');

const tables = [
    'main_html', 'main', 'otp', 'dash2', 'otp2', 'dash3',
    'dash4', 'dash5', 'dash6', 'dash7', 'principlepalace',
    'additionalplaces', 'goods', 'state_20specific', 'adhar',
    'loginpage', 'welcome', 'test_up'
];

// Add application_id column to all tables
console.log('Adding application_id columns...');
for (const table of tables) {
    try {
        db.exec(`ALTER TABLE [${table}] ADD COLUMN [application_id] INTEGER`);
        console.log(`  [OK] ${table}`);
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log(`  [--] ${table} (already exists)`);
        } else {
            console.log(`  [!!] ${table}: ${e.message}`);
        }
    }
}

// Create indexes
console.log('\nCreating indexes...');
for (const table of tables) {
    const idxName = `idx_${table.replace(/[^a-zA-Z0-9]/g, '_')}_app`;
    try {
        db.exec(`CREATE INDEX IF NOT EXISTS [${idxName}] ON [${table}] ([application_id])`);
        console.log(`  [OK] ${idxName}`);
    } catch (e) {
        console.log(`  [!!] ${idxName}: ${e.message}`);
    }
}

// Create session_id index on registrations
try {
    db.exec('CREATE INDEX IF NOT EXISTS [idx_registrations_session] ON [registrations] ([session_id])');
    console.log('  [OK] idx_registrations_session');
} catch (e) {
    console.log(`  [!!] idx_registrations_session: ${e.message}`);
}

// Migrate existing data
console.log('\nMigrating existing data...');

// Create registrations from existing Session IDs in main_html
db.exec(`
    INSERT OR IGNORE INTO [registrations] ([session_id])
    SELECT DISTINCT [Session ID] FROM [main_html]
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Created registrations from main_html Session IDs');

// Link main_html rows
db.exec(`
    UPDATE [main_html]
    SET [application_id] = (
        SELECT [application_id] FROM [registrations]
        WHERE [registrations].[session_id] = [main_html].[Session ID]
    )
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Linked main_html rows');

// Link otp rows
db.exec(`
    UPDATE [otp]
    SET [application_id] = (
        SELECT [application_id] FROM [registrations]
        WHERE [registrations].[session_id] = [otp].[Session ID]
    )
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Linked otp rows');

// Link dash2 rows
db.exec(`
    UPDATE [dash2]
    SET [application_id] = (
        SELECT [application_id] FROM [registrations]
        WHERE [registrations].[session_id] = [dash2].[Session ID]
    )
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Linked dash2 rows');

// Link otp2 rows
db.exec(`
    UPDATE [otp2]
    SET [application_id] = (
        SELECT [application_id] FROM [registrations]
        WHERE [registrations].[session_id] = [otp2].[Session ID]
    )
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Linked otp2 rows');

// Link test_up rows
db.exec(`
    UPDATE [test_up]
    SET [application_id] = (
        SELECT [application_id] FROM [registrations]
        WHERE [registrations].[session_id] = [test_up].[Session ID]
    )
    WHERE [Session ID] IS NOT NULL AND [Session ID] != ''
`);
console.log('  Linked test_up rows');

// Verify
console.log('\n--- Verification ---');
const regCount = db.prepare('SELECT COUNT(*) as cnt FROM [registrations]').get();
console.log(`registrations: ${regCount.cnt} rows`);

for (const table of tables) {
    try {
        const linked = db.prepare(`SELECT COUNT(*) as cnt FROM [${table}] WHERE [application_id] IS NOT NULL`).get();
        if (linked.cnt > 0) {
            console.log(`${table}: ${linked.cnt} linked rows`);
        }
    } catch (e) {}
}

// Sample registration
const sample = db.prepare('SELECT * FROM [registrations] LIMIT 3').all();
console.log('\nSample registrations:', sample);

db.close();
console.log('\nMigration complete!');
