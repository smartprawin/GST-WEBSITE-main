const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 4000;

const DB_FILE = path.join(__dirname, 'data.sqlite');

let db;

app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(express.static(__dirname));

function initDatabase() {
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');
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
    } catch (e) {
        // Column already exists, ignore
    }
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
        delete formData._sheet;

        const columns = Object.keys(formData);
        columns.forEach(col => addColumnIfMissing(tableName, col));

        const safeColumns = columns.map(c => `[${c.replace(/[^a-zA-Z0-9_ ]/g, '_')}]`);
        const placeholders = columns.map(() => '?');
        const values = columns.map(c => formData[c]);

        const sql = `INSERT INTO [${tableName}] (${safeColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const stmt = db.prepare(sql);
        stmt.run(...values);

        const count = db.prepare(`SELECT COUNT(*) as cnt FROM [${tableName}]`).get();

        res.json({
            success: true,
            message: `Data exported to ${tableName}`,
            rows: count.cnt
        });
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

app.get('/view', (req, res) => {
    try {
        const tableName = req.query.table || 'main_html';
        const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        const rows = db.prepare(`SELECT * FROM [${safeName}]`).all();
        const cols = rows.length ? Object.keys(rows[0]) : [];

        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeName}</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;background:#f4f6f9}
        h2{color:#0d2566}table{border-collapse:collapse;width:100%;background:#fff}
        th,td{border:1px solid #cdd;padding:8px 10px;text-align:left;font-size:13px}
        th{background:#0d2566;color:#fff}tr:nth-child(even){background:#eef3fb}</style></head><body>
        <h2>Data in table: ${safeName}</h2>
        <p><a href="/view?table=main_html">main_html</a> | <a href="/view?table=main">main</a></p>`;

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

app.listen(PORT, () => {
    console.log(`GST Website running at http://localhost:${PORT}`);
    initDatabase();
});
