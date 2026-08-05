require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LOG_DIR = path.join(ROOT_DIR, 'logs');

const DB_FILE = process.env.DB_PATH || path.join(DATA_DIR, 'data.sqlite');

let db;

app.use(cors());
app.use(express.json());
app.use(express.text());

const DEMO_BANNER = `
  <div id="demoBanner" style="background:#b98900;color:#fff;font-weight:bold;text-align:center;padding:8px 12px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:.3px;position:relative;z-index:9999;">
  &#9888; DEMO WEBSITE &mdash; This is a non-official demonstration project. Do not enter real personal or financial information.
</div>
`;

function getValidateFlag(req) {
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    return url.searchParams.get('validate') === '1';
}

app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.toLowerCase().endsWith('.html')) {
        const filePath = path.join(PUBLIC_DIR, decodeURIComponent(req.path));
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err || !/<\/html>/i.test(data)) return next();
            const validateFlag = getValidateFlag(req);
            const globalScript = `<script>window.VALIDATE = ${validateFlag};</script>`;
            let html = data.replace(/<body[^>]*>/i, (m) => m + DEMO_BANNER + globalScript);
            res.type('html').send(html);
        });
        return;
    }
    next();
});

app.use(express.static(PUBLIC_DIR));

function logError(context, err) {
    try {
        const logFile = path.join(LOG_DIR, 'server.err');
        fs.appendFileSync(logFile, '\n' + new Date().toISOString() + ' ' + context + ': ' + err.stack);
    } catch (e) {}
}

function initDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');
    ensureRegistrationsTable();
    ensureApplicationIdColumns();
}

const REGISTRATION_TABLES = [
    'main_html', 'main', 'otp', 'dash2', 'otp2', 'dash3',
    'dash4', 'dash5', 'dash6', 'dash7', 'principlepalace',
    'additionalplaces', 'goods', 'state_20specific', 'adhar',
    'loginpage', 'welcome', 'test_up'
];

function ensureRegistrationsTable() {
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
    try {
        db.exec('CREATE INDEX IF NOT EXISTS [idx_registrations_session] ON [registrations] ([session_id])');
    } catch (e) {}
}

function ensureApplicationIdColumns() {
    for (const table of REGISTRATION_TABLES) {
        try {
            db.exec(`ALTER TABLE [${table}] ADD COLUMN [application_id] INTEGER`);
        } catch (e) {}
        try {
            const idxName = `idx_${table.replace(/[^a-zA-Z0-9]/g, '_')}_app`;
            db.exec(`CREATE INDEX IF NOT EXISTS [${idxName}] ON [${table}] ([application_id])`);
        } catch (e) {}
    }
}

function getOrCreateRegistration(sessionId) {
    if (!sessionId) return null;
    let reg = db.prepare('SELECT [application_id] FROM [registrations] WHERE [session_id] = ?').get(sessionId);
    if (!reg) {
        const info = db.prepare('INSERT INTO [registrations] ([session_id]) VALUES (?)').run(sessionId);
        reg = { application_id: info.lastInsertRowid };
    }
    return reg.application_id;
}

function updateRegistrationStep(sessionId, step) {
    if (!sessionId) return;
    db.prepare('UPDATE [registrations] SET [current_step] = ?, [updated_at] = CURRENT_TIMESTAMP WHERE [session_id] = ?')
        .run(step, sessionId);
}

function ensureTable(tableName) {
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
    db.exec(`CREATE TABLE IF NOT EXISTS [${safeName}] (
        id INTEGER PRIMARY KEY AUTOINCREMENT
    )`);
    return safeName;
}

function addColumnIfMissing(table, column) {
    const safeCol = column.replace(/[^a-zA-Z0-9_ ]/g, '_');
    try {
        db.exec(`ALTER TABLE [${table}] ADD COLUMN [${safeCol}] TEXT`);
    } catch (e) {}
}

app.post('/api/export', (req, res) => {
    try {
        let formData = req.body;

        if (typeof formData === 'string') {
            try {
                formData = JSON.parse(formData);
            } catch {
                return res.status(400).json({ error: 'Invalid JSON' });
            }
        }

        if (!formData || Object.keys(formData).length === 0) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const tableName = ensureTable(formData._sheet || 'form_data');
        const currentStep = formData._sheet || 'form_data';
        delete formData._sheet;

        const sessionId = formData['Session ID'];
        delete formData['Session ID'];

        const applicationId = sessionId ? getOrCreateRegistration(sessionId) : null;
        if (sessionId && applicationId) {
            updateRegistrationStep(sessionId, currentStep);
        }

        const columns = Object.keys(formData);
        if (columns.length === 0) {
            return res.json({ success: true, message: 'No fields to export', rows: 0, application_id: applicationId });
        }
        columns.forEach(col => addColumnIfMissing(tableName, col));
        addColumnIfMissing(tableName, 'Session ID');
        addColumnIfMissing(tableName, 'application_id');

        const safeCol = c => `[${c.replace(/[^a-zA-Z0-9_ ]/g, '_')}]`;

        const existing = sessionId
            ? db.prepare(`SELECT [id] FROM [${tableName}] WHERE [Session ID] = ?`).get(sessionId)
            : null;

        if (existing) {
            const setClauses = columns.map(c => `${safeCol(c)} = ?`).join(', ');
            const updateSql = `UPDATE [${tableName}] SET ${setClauses}, [application_id] = ? WHERE [id] = ?`;
            db.prepare(updateSql).run(...columns.map(c => formData[c]), applicationId, existing.id);
        } else {
            const allCols = ['Session ID', 'application_id', ...columns];
            const safeColumns = allCols.map(c => safeCol(c));
            const placeholders = allCols.map(() => '?');
            const values = [sessionId, applicationId, ...columns.map(c => formData[c])];

            const insertSql = `INSERT INTO [${tableName}] (${safeColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
            db.prepare(insertSql).run(...values);
        }

        const count = db.prepare(`SELECT COUNT(*) as cnt FROM [${tableName}]`).get();

        res.json({
            success: true,
            message: `Data exported to ${tableName}`,
            rows: count.cnt,
            application_id: applicationId
        });
    } catch (err) {
        console.error('Export error:', err);
        logError('/api/export', err);
        res.status(500).json({ error: 'Failed to export data: ' + err.message });
    }
});

app.get('/api/registration', (req, res) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
            return res.status(400).json({ error: 'session_id is required' });
        }
        const reg = db.prepare('SELECT * FROM [registrations] WHERE [session_id] = ?').get(sessionId);
        if (!reg) {
            return res.status(404).json({ error: 'Registration not found' });
        }
        res.json({ success: true, registration: reg });
    } catch (err) {
        console.error('Get registration error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/registration/:id', (req, res) => {
    try {
        const applicationId = req.params.id;
        const reg = db.prepare('SELECT * FROM [registrations] WHERE [application_id] = ?').get(applicationId);
        if (!reg) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        const data = { registration: reg, steps: {} };
        for (const table of REGISTRATION_TABLES) {
            try {
                const row = db.prepare(`SELECT * FROM [${table}] WHERE [application_id] = ? LIMIT 1`).get(applicationId);
                if (row) data.steps[table] = row;
            } catch (e) {}
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('Get registration by ID error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/registrations', (req, res) => {
    try {
        const regs = db.prepare('SELECT * FROM [registrations] ORDER BY [application_id] DESC').all();
        res.json({ success: true, count: regs.length, registrations: regs });
    } catch (err) {
        console.error('List registrations error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', (req, res) => {
    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
        }

        const username = (body.username || '').toString().trim();
        const password = (body.password || '').toString();
        const sessionId = body.session_id || null;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        const passwordHash = salt + ':' + hash;

        const applicationId = sessionId ? getOrCreateRegistration(sessionId) : null;

        ensureTable('loginpage');
        addColumnIfMissing('loginpage', 'application_id');
        const info = db.prepare('INSERT INTO [loginpage] ([Username], [Password], [application_id]) VALUES (?, ?, ?)')
            .run(username, passwordHash, applicationId);

        res.json({
            success: true,
            message: 'Login details saved to loginpage',
            id: info.lastInsertRowid,
            application_id: applicationId
        });
    } catch (err) {
        console.error('Login save error:', err);
        logError('/api/login', err);
        res.status(500).json({ error: 'Failed to save login details: ' + err.message });
    }
});

app.get('/view', (req, res) => {
    try {
        const tableName = req.query.table || 'main_html';
        const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        const rows = db.prepare(`SELECT * FROM [${safeName}]`).all();
        const cols = rows.length ? Object.keys(rows[0]) : [];

        const navLinks = ['main_html', 'registrations', 'loginpage', 'otp', 'dash2', 'dash5', 'dash4']
            .map(t => `<a href="/view?table=${t}">${t}</a>`).join(' | ');

        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeName}</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;background:#f4f6f9}
        h2{color:#0d2566}table{border-collapse:collapse;width:100%;background:#fff}
        th,td{border:1px solid #cdd;padding:8px 10px;text-align:left;font-size:13px}
        th{background:#0d2566;color:#fff}tr:nth-child(even){background:#eef3fb}
        a{margin:0 8px}</style></head><body>
        <h2>Data in table: ${safeName}</h2>
        <p>${navLinks}</p>`;

        if (!rows.length) {
            html += '<p>No rows found.</p></body></html>';
        } else {
            html += '<table><thead><tr>';
            cols.forEach(c => html += `<th>${c}</th>`);
            html += '</tr></thead><tbody>';
            rows.forEach(r => {
                html += '<tr>';
                cols.forEach(c => html += `<td>${(r[c] === null || r[c] === undefined) ? '' : r[c]}</td>`);
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
        html += '</body></html>';
        res.send(html);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

function seedAdmin() {
    ensureTable('loginpage');
    const existing = db.prepare('SELECT 1 FROM [loginpage] WHERE [Username] = ?').get('admin');
    if (!existing) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync('admin', salt, 64).toString('hex');
        db.prepare('INSERT INTO [loginpage] ([Username], [Password]) VALUES (?, ?)')
            .run('admin', salt + ':' + hash);
        console.log('Seeded default admin account (username: admin, password: admin)');
    }
}

app.listen(PORT, () => {
    console.log(`GST Website running at http://localhost:${PORT}`);
    console.log(`Public directory: ${PUBLIC_DIR}`);
    console.log(`Database: ${DB_FILE}`);
    initDatabase();
    seedAdmin();
});
