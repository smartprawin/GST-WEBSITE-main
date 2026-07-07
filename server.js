const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'data.xlsx');

app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(express.static(__dirname));

// Ensure data.xlsx exists with headers
function ensureDataFile() {
    try {
        XLSX.readFile(DATA_FILE);
    } catch {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, ws, 'Form Data');
        XLSX.writeFile(wb, DATA_FILE);
    }
}

// POST /api/export — append form data to data.xlsx
app.post('/api/export', (req, res) => {
    try {
        let formData = req.body;

        // Handle text/plain from sendBeacon
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

        // Get sheet name from _sheet field, fallback to 'Form Data'
        const sheetName = formData._sheet || 'Form Data';
        delete formData._sheet;

        ensureDataFile();

        const wb = XLSX.readFile(DATA_FILE);
        let ws = wb.Sheets[sheetName];

        // Read existing data
        const existingData = ws ? XLSX.utils.sheet_to_json(ws) : [];
        existingData.push(formData);

        // Create new worksheet with all data
        const newWs = XLSX.utils.json_to_sheet(existingData);

        // Auto-size columns
        const colWidths = Object.keys(formData).map(key => ({
            wch: Math.max(key.length + 2, 15)
        }));
        newWs['!cols'] = colWidths;

        wb.Sheets[sheetName] = newWs;
        XLSX.writeFile(wb, DATA_FILE);

        res.json({ success: true, message: `Data exported to ${sheetName}`, rows: existingData.length });
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

app.listen(PORT, () => {
    console.log(`GST Website running at http://localhost:${PORT}`);
    ensureDataFile();
});
