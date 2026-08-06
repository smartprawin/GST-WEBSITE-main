# Database Connection Documentation

## Overview

The GST Website uses **SQLite** as its database engine, accessed via the `better-sqlite3` npm package. This is a lightweight, file-based database that requires no separate server process.

## Architecture

```
Frontend (HTML/JS)
    │
    ▼
Express Server (src/server.js)
    │
    ▼
better-sqlite3 (synchronous driver)
    │
    ▼
SQLite Database File (data/data.sqlite)
```

## Configuration

### Environment Variables (.env)

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_PATH` | `./data/data.sqlite` | Database file location |
| `LOG_PATH` | `./logs` | Log directory |

### Database File Location

- **Primary file**: `data/data.sqlite`
- **WAL files**: `data.sqlite-shm` and `data.sqlite-shm` (Write-Ahead Logging)
- **Note**: SQLite files are excluded from git via `.gitignore`

## Connection Setup

The database connection is established in `src/server.js` during server startup:

```javascript
// src/server.js - initDatabase() function
function initDatabase() {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Create database connection
    db = new Database(DB_FILE);
    
    // Configure pragmas
    db.pragma('journal_mode = WAL');      // Better concurrent performance
    db.pragma('busy_timeout = 5000');     // Wait 5s if locked
    db.pragma('foreign_keys = ON');       // Enforce foreign keys
    
    // Ensure tables exist
    ensureRegistrationsTable();
    ensureApplicationIdColumns();
}
```

### Key Configuration Options

| Pragma | Value | Purpose |
|--------|-------|---------|
| `journal_mode` | `WAL` | Enables Write-Ahead Logging for better read/write concurrency |
| `busy_timeout` | `5000` | Wait up to 5 seconds if database is locked |
| `foreign_keys` | `ON` | Enforce foreign key constraints |

## Schema Structure

### Master Table: `registrations`

```sql
CREATE TABLE IF NOT EXISTS [registrations] (
    [application_id]  INTEGER PRIMARY KEY AUTOINCREMENT,
    [session_id]      TEXT UNIQUE,
    [created_at]      DATETIME DEFAULT CURRENT_TIMESTAMP,
    [updated_at]      DATETIME DEFAULT CURRENT_TIMESTAMP,
    [status]          TEXT DEFAULT 'draft',
    [current_step]    TEXT DEFAULT 'main_html'
);
```

### Step Tables (18 tables)

Each registration step has its own table with dynamic columns:

| Table Name | Purpose |
|------------|---------|
| `main_html` | Initial registration form |
| `main` | Main registration data |
| `otp` | OTP verification |
| `dash2` | Temporary Reference Number (TRN) |
| `otp2` | Second OTP verification |
| `dash3` | Business details continuation |
| `dash4` | Promoter/Partner details |
| `dash5` | Business details |
| `dash6` | Authorized signatory |
| `dash7` | Additional signatory info |
| `principlepalace` | Principal place of business |
| `additionalplaces` | Additional places of business |
| `goods` | HSN goods/services |
| `state_20specific` | State-specific information |
| `adhar` | Aadhaar verification |
| `loginpage` | Login credentials |
| `welcome` | Welcome page data |
| `test_up` | Test upload data |

### Dynamic Schema

Step tables use a **dynamic schema** - columns are added automatically via `ALTER TABLE` when form data is exported:

```javascript
// src/server.js - addColumnIfMissing() function
function addColumnIfMissing(table, column) {
    try {
        db.prepare(`ALTER TABLE [${table}] ADD COLUMN [${column}] TEXT`).run();
    } catch (e) {
        // Ignore "duplicate column" errors
        if (!e.message.includes('duplicate column')) throw e;
    }
}
```

## Query Patterns

The project uses **raw SQL** with `better-sqlite3` prepared statements. No ORM is used.

### Read Operations

```javascript
// Fetch single row
const row = db.prepare('SELECT * FROM registrations WHERE session_id = ?').get(sessionId);

// Fetch multiple rows
const rows = db.prepare('SELECT * FROM registrations').all();

// Count rows
const count = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
```

### Write Operations

```javascript
// Insert data
db.prepare('INSERT INTO registrations (session_id) VALUES (?)').run(sessionId);

// Update data
db.prepare('UPDATE registrations SET status = ? WHERE application_id = ?').run(status, id);

// Execute DDL
db.exec('CREATE TABLE IF NOT EXISTS ...');
```

## API Endpoints

| Endpoint | Method | Handler Function | Database Operations |
|----------|--------|------------------|---------------------|
| `/api/export` | POST | Anonymous arrow function (server.js:141-210) | INSERT/UPDATE step tables |
| `/api/registration` | GET | Anonymous arrow function | SELECT from registrations |
| `/api/registration/:id` | GET | Anonymous arrow function | SELECT from registrations + all step tables |
| `/api/registrations` | GET | Anonymous arrow function | SELECT all registrations |
| `/api/login` | POST | Anonymous arrow function (server.js:262-299) | INSERT into loginpage |
| `/view` | GET | Anonymous arrow function | SELECT from dynamic table |

## Database INSERT Operations

### Overview

The project has **4 distinct INSERT points** in `src/server.js`:

| # | Function | File:Line | Endpoint | Table |
|---|----------|-----------|----------|-------|
| 1 | `getOrCreateRegistration()` | server.js:110-118 | Called internally | `registrations` |
| 2 | `/api/export` handler | server.js:141-210 | `POST /api/export` | Dynamic (18+ tables) |
| 3 | `/api/login` handler | server.js:262-299 | `POST /api/login` | `loginpage` |
| 4 | `seedAdmin()` | server.js:340-350 | Startup only | `loginpage` |

---

### INSERT #1: `getOrCreateRegistration(sessionId)`

**File**: `src/server.js:110-118`

```javascript
function getOrCreateRegistration(sessionId) {
    // Check if registration exists
    const existing = db.prepare(
        'SELECT [application_id] FROM [registrations] WHERE [session_id] = ?'
    ).get(sessionId);
    
    if (existing) {
        return existing.application_id;
    }
    
    // Insert new registration
    const info = db.prepare(
        'INSERT INTO [registrations] ([session_id]) VALUES (?)'
    ).run(sessionId);
    
    return info.lastInsertRowid;
}
```

**Purpose**: Creates or retrieves a registration record for a given session ID.

**Parameters**:
- `sessionId` (TEXT) - UUID generated by the client's browser

**Returns**: `application_id` (INTEGER) - The primary key of the registration

**Called by**:
- `/api/export` handler (line 164)
- `/api/login` handler (line 281)

---

### INSERT #2: `/api/export` Handler

**File**: `src/server.js:141-210`

```javascript
app.post('/api/export', (req, res) => {
    try {
        const formData = req.body;
        const sessionId = formData['Session ID'];
        const tableName = formData._sheet;
        
        // Get or create registration
        const applicationId = getOrCreateRegistration(sessionId);
        
        // Build dynamic columns and values
        const columns = [];
        const values = [];
        const placeholders = [];
        
        for (const [key, value] of Object.entries(formData)) {
            if (key === '_sheet') continue; // Skip metadata
            
            columns.push(`[${key}]`);
            values.push(value);
            placeholders.push('?');
            
            // Add column if it doesn't exist
            addColumnIfMissing(tableName, key);
        }
        
        // Add application_id column
        columns.push('[application_id]');
        values.push(applicationId);
        placeholders.push('?');
        addColumnIfMissing(tableName, 'application_id');
        
        // Check if row exists for this session
        const existing = db.prepare(
            `SELECT [id] FROM [${tableName}] WHERE [Session ID] = ?`
        ).get(sessionId);
        
        if (existing) {
            // UPDATE existing row
            const setClause = columns.map((col, i) => `${col} = ${placeholders[i]}`).join(', ');
            db.prepare(
                `UPDATE [${tableName}] SET ${setClause} WHERE [Session ID] = ?`
            ).run(...values, sessionId);
        } else {
            // INSERT new row
            db.prepare(
                `INSERT INTO [${tableName}] (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
            ).run(...values);
        }
        
        res.json({ 
            success: true, 
            application_id: applicationId 
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});
```

**Endpoint**: `POST /api/export`

**Purpose**: Receives form data from the frontend and saves it to the appropriate step table.

**Request Body**:
```json
{
    "_sheet": "main_html",
    "Session ID": "uuid-string",
    "Field Name 1": "value1",
    "Field Name 2": "value2"
}
```

**Response**:
```json
{
    "success": true,
    "application_id": 123
}
```

**Logic**:
1. Extracts `_sheet` (target table name) and `Session ID` from request body
2. Calls `getOrCreateRegistration()` to get/create `application_id`
3. Iterates through all form fields, adding columns dynamically if missing
4. Checks if a row with this `Session ID` already exists in the target table
5. If exists: UPDATE the existing row
6. If not: INSERT a new row
7. Returns `application_id` to the client

**Dynamic Column Creation**:
```javascript
function addColumnIfMissing(table, column) {
    try {
        db.prepare(`ALTER TABLE [${table}] ADD COLUMN [${column}] TEXT`).run();
    } catch (e) {
        // Ignore "duplicate column" errors
        if (!e.message.includes('duplicate column')) throw e;
    }
}
```

---

### INSERT #3: `/api/login` Handler

**File**: `src/server.js:262-299`

```javascript
app.post('/api/login', (req, res) => {
    try {
        const { username, password, session_id } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Hash password with salt
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        const passwordHash = salt + ':' + hash;
        
        // Get or create registration if session_id provided
        let applicationId = null;
        if (session_id) {
            applicationId = getOrCreateRegistration(session_id);
        }
        
        // Ensure loginpage table exists
        db.exec(`CREATE TABLE IF NOT EXISTS [loginpage] (
            [id] INTEGER PRIMARY KEY AUTOINCREMENT,
            [Username] TEXT,
            [Password] TEXT,
            [application_id] INTEGER
        )`);
        
        // Insert login credentials
        db.prepare(
            'INSERT INTO [loginpage] ([Username], [Password], [application_id]) VALUES (?, ?, ?)'
        ).run(username, passwordHash, applicationId);
        
        res.json({ 
            success: true, 
            application_id: applicationId 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});
```

**Endpoint**: `POST /api/login`

**Purpose**: Saves user login credentials to the database.

**Request Body**:
```json
{
    "username": "user@example.com",
    "password": "mypassword",
    "session_id": "optional-uuid"
}
```

**Response**:
```json
{
    "success": true,
    "application_id": 123
}
```

**Logic**:
1. Extracts `username`, `password`, and optional `session_id` from request body
2. Generates random 16-byte salt
3. Hashes password using `crypto.scryptSync` with the salt
4. Formats password as `salt:hash` string
5. If `session_id` provided, calls `getOrCreateRegistration()` to link login to registration
6. Ensures `loginpage` table exists
7. Inserts credentials into `loginpage` table
8. Returns `application_id` to the client

**Note**: This is INSERT-ONLY - every login attempt creates a new row (no duplicate checking).

---

### INSERT #4: `seedAdmin()`

**File**: `src/server.js:340-350`

```javascript
function seedAdmin() {
    // Ensure loginpage table exists
    db.exec(`CREATE TABLE IF NOT EXISTS [loginpage] (
        [id] INTEGER PRIMARY KEY AUTOINCREMENT,
        [Username] TEXT,
        [Password] TEXT,
        [application_id] INTEGER
    )`);
    
    // Check if admin exists
    const admin = db.prepare(
        'SELECT 1 FROM [loginpage] WHERE [Username] = ?'
    ).get('admin');
    
    if (!admin) {
        // Create admin with default password
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync('admin', salt, 64).toString('hex');
        const passwordHash = salt + ':' + hash;
        
        db.prepare(
            'INSERT INTO [loginpage] ([Username], [Password]) VALUES (?, ?)'
        ).run('admin', passwordHash);
        
        console.log('Default admin account created (username: admin, password: admin)');
    }
}
```

**Purpose**: Creates a default admin account on first server startup.

**Runs at**: Server startup (called in `app.listen()` callback)

**Default Credentials**:
- Username: `admin`
- Password: `admin`

**Logic**:
1. Ensures `loginpage` table exists
2. Checks if `admin` user already exists
3. If not, creates admin with hashed password
4. Logs success message to console

---

## Client-Side Data Collection

### `public/form-exporter.js`

This is the main client-side file that collects form data and sends it to the server.

**Key Functions**:

```javascript
// Get or create session ID
function getSessionId() {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID() || 'sess_' + Date.now();
        localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
}

// Collect all form fields from the current page
function collectFormData() {
    const data = {};
    const form = document.querySelector('form') || document;
    
    // Collect input fields
    form.querySelectorAll('input, select, textarea').forEach(el => {
        const name = el.name || el.id || el.getAttribute('data-field');
        if (!name) return;
        
        if (el.type === 'radio') {
            if (el.checked) data[name] = el.value;
        } else if (el.type === 'checkbox') {
            data[name] = el.checked ? 'Yes' : 'No';
        } else {
            data[name] = el.value;
        }
    });
    
    return data;
}

// Main export function - sends data and navigates
function exportAndGo(url) {
    const data = collectFormData();
    data._sheet = getSheetName();  // Maps page filename to table name
    data['Session ID'] = getSessionId();
    
    // Navigate immediately (don't wait for response)
    window.location.href = url;
    
    // Send data in background
    fetch('http://localhost:4000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
    }).then(response => response.json())
      .then(result => {
          if (result.application_id) {
              localStorage.setItem('application_id', result.application_id);
          }
      })
      .catch(err => console.error('Export error:', err));
}

// Map page filename to table name
function getSheetName() {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    const mapping = {
        'MAIN': 'main_html',
        'OTP': 'otp',
        'dash2': 'dash2',
        'OTP2': 'otp2',
        'dash3': 'dash3',
        'dash4': 'dash4',
        'dash5': 'dash5',
        'dash6': 'dash6',
        'dash7': 'dash7',
        'principlepalace': 'principlepalace',
        'additionalplaces': 'additionalplaces',
        'goods': 'goods',
        'state specific': 'state_20specific',
        'adhar': 'adhar',
        'welcome': 'welcome',
        'verification': 'test_up'
    };
    return mapping[page] || page.toLowerCase();
}
```

**Usage in HTML Pages**:
```html
<!-- Navigation button that exports data -->
<button onclick="exportAndGo('next-page.html')">Save & Continue</button>
```

---

### `public/login/loginPage.html`

Custom login function that calls `/api/login`:

```javascript
async function doLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:4000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                password,
                session_id: getSessionId()
            }),
            keepalive: true
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('application_id', result.application_id);
            window.location.href = 'welcome.html';
        } else {
            alert('Login failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}
```

---

## Data Flow Summary

### Complete Data Flow: Form to Database

```
1. User fills form on HTML page (e.g., MAIN.html)
2. Clicks "Save & Continue" button
3. exportAndGo('OTP.html') is called
4. collectFormData() gathers all form field values
5. getSheetName() returns 'main_html' (target table)
6. getSessionId() returns UUID from localStorage
7. Data object built:
   {
       _sheet: 'main_html',
       'Session ID': 'uuid-1234',
       'Field1': 'value1',
       'Field2': 'value2'
   }
8. Browser navigates to OTP.html immediately
9. fetch() POSTs data to http://localhost:4000/api/export
10. Server receives request
11. getOrCreateRegistration('uuid-1234') called
    - Checks if registration exists
    - If not, INSERTs into registrations table
    - Returns application_id
12. addColumnIfMissing() called for each field
    - ALTERs table to add columns if missing
13. Checks if row exists in main_html for this Session ID
    - If exists: UPDATE row
    - If not: INSERT new row
14. Returns { success: true, application_id: 123 }
15. Client stores application_id in localStorage
```

### Table-to-Page Mapping

| Table Name | Source HTML Page(s) | Trigger Function |
|------------|---------------------|------------------|
| `main_html` | MAIN.html, dash2.html | `exportAndGo()`, `saveTrnAndGo()` |
| `otp` | OTP.html | `exportAndGo()` |
| `dash2` | dash2.html | `exportAndGo()` |
| `otp2` | OTP2.html | `exportAndGo()` |
| `dash3` | dash3.html | `exportAndGo()` |
| `dash4` | dash4.html, dash41.html | `exportAndGo()` |
| `dash5` | dash5.html | `exportAndGo()` |
| `dash6` | dash6.html | `exportAndGo()` |
| `dash7` | dash7.html | `exportAndGo()` |
| `principlepalace` | principlepalace.html | `exportAndGo()` |
| `additionalplaces` | additionalplaces.html | `exportAndGo()` |
| `goods` | goods.html | `exportAndGo()` |
| `state_20specific` | state specific.html | `exportAndGo()` |
| `adhar` | adhar.html | `exportAndGo()` |
| `loginpage` | loginPage.html | `doLogin()`, `seedAdmin()` |
| `welcome` | welcome.html | `exportAndGo()` |
| `test_up` | verification.html | `exportAndGo()` |

## Migration System

### Manual Migrations

```bash
# Run all migrations
npm run migrate

# Files:
# - src/db/migrations/migrate.sql
# - src/db/migrations/run-migration.js
```

### Auto-Migration at Startup

The server automatically:
1. Creates `registrations` table if missing
2. Adds `application_id` column to all step tables if missing

## Security Considerations

### Password Hashing

Passwords are hashed using `crypto.scryptSync`:

```javascript
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');
const passwordHash = salt + ':' + hash;
```

### Known Limitations

1. **No authentication middleware** - Passwords are saved but not verified
2. **Hardcoded localhost** - Frontend uses `http://localhost:4000`
3. **No connection pooling** - Single synchronous connection
4. **No input validation** - SQL injection possible if inputs not sanitized

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database locked | Increase `busy_timeout` or check for long-running queries |
| Missing columns | Server auto-adds columns on startup |
| WAL files growing | Normal behavior; WAL checkpointed automatically |
| Database not found | Check `DB_PATH` in `.env` |

### Debug Queries

```bash
# Open database directly
sqlite3 data/data.sqlite

# List tables
.tables

# Show schema
.schema registrations

# Query data
SELECT * FROM registrations LIMIT 10;
```

## Performance Notes

- **WAL mode** allows concurrent reads during writes
- **Synchronous driver** means requests are serialized at Node.js event loop level
- **No connection pooling** - suitable for single-process deployment
- **File-based** - performance degrades with very large datasets (>1GB)

## Backup Strategy

```bash
# Backup database
cp data/data.sqlite data/backup_$(date +%Y%m%d).sqlite

# Or using SQLite CLI
sqlite3 data/data.sqlite ".backup data/backup.sqlite"
```
