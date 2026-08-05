# GST Website - Complete Page & Route Reference

> Auto-generated documentation of all pages, links, forms, and API endpoints.

---

## Table of Contents

1. [Server Routes](#server-routes)
2. [API Endpoints](#api-endpoints)
3. [Database Schema & Relationships](#database-schema--relationships)
4. [Login Flow Pages](#login-flow)
5. [Registration Flow Pages](#registration-flow)
6. [Navigation Flow Diagrams](#navigation-flow)
7. [Shared Scripts](#shared-scripts)
8. [Database Tables](#database-tables)

---

## Server Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `*` (middleware) | Injects "DEMO WEBSITE" banner + `window.VALIDATE` script into all `.html` pages |
| `GET` | `*` (static) | Serves all root-level static files (HTML, CSS, JS, images) |
| `POST` | `/api/export` | Saves form data to SQLite (upserts by Session ID, links to registration) |
| `POST` | `/api/login` | Saves hashed login credentials to `loginpage` table |
| `GET` | `/api/registrations` | List all registrations |
| `GET` | `/api/registration?session_id=X` | Get registration by session ID |
| `GET` | `/api/registration/:id` | Get registration + all linked step data |
| `GET` | `/view?table=<name>` | Admin data viewer - displays SQLite table as HTML |

**Port:** 4000  
**Database:** `data.sqlite` (SQLite, WAL mode, foreign keys ON)

---

## API Endpoints

### POST /api/export

Saves form field data from any page to a dynamically-named SQLite table. Automatically creates/links to a registration via `application_id`.

```json
// Request
{
  "_sheet": "main_html",
  "Session ID": "uuid-string",
  "Field Name": "value",
  ...
}

// Response
{
  "success": true,
  "message": "Data exported to main_html",
  "rows": 36,
  "application_id": 7
}
```

- Called by `form-exporter.js` on every page navigation via `exportAndGo()`
- Uses Session ID to merge/update rows for the same user session
- Automatically creates a `registrations` record if none exists for the session
- Links all step tables via `application_id` foreign key
- Table is created automatically if it doesn't exist

### POST /api/login

Saves login credentials with scrypt hashing. Optionally links to a registration.

```json
// Request
{
  "username": "string",
  "password": "string",
  "session_id": "uuid-string"  // optional, links to registration
}

// Response
{
  "success": true,
  "message": "Login details saved to loginpage",
  "id": 34,
  "application_id": 7
}
```

### GET /api/registrations

List all registrations ordered by most recent first.

```json
// Response
{
  "success": true,
  "count": 7,
  "registrations": [
    {
      "application_id": 7,
      "session_id": "test-fk-001",
      "created_at": "2026-08-05 10:44:41",
      "updated_at": "2026-08-05 10:44:41",
      "status": "draft",
      "current_step": "main_html"
    }
  ]
}
```

### GET /api/registration?session_id=X

Get a single registration by session ID.

```json
// Response
{
  "success": true,
  "registration": {
    "application_id": 7,
    "session_id": "test-fk-001",
    "created_at": "2026-08-05 10:44:41",
    "updated_at": "2026-08-05 10:44:41",
    "status": "draft",
    "current_step": "main_html"
  }
}
```

### GET /api/registration/:id

Get a registration by ID with all linked step data (JOIN across all tables).

```json
// Response
{
  "success": true,
  "data": {
    "registration": { "application_id": 7, ... },
    "steps": {
      "main_html": { "Name": "FK Test", "Email": "fk@test.com", ... },
      "otp": { ... },
      "dash5": { ... }
    }
  }
}
```

### GET /view?table=<name>

Admin HTML viewer for any SQLite table. Defaults to `main_html`.

**Examples:**
- `http://localhost:4000/view?table=main_html`
- `http://localhost:4000/view?table=registrations`
- `http://localhost:4000/view?table=loginpage`
- `http://localhost:4000/view?table=otp`

---

## Database Schema & Relationships

### Entity Relationship Diagram

```
+------------------+
|  registrations   |
|------------------|
| application_id   | <-- PRIMARY KEY
| session_id       |     (unique)
| created_at       |
| updated_at       |
| status           |
| current_step     |
+--------+---------+
         |
         | 1:N (application_id FK)
         |
         +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
         |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
         v  v  v  v  v  v  v  v  v  v  v  v  v  v  v  v  v
       main otp dash dash dash dash dash principle additional goods state adhar login welcome test
       _html 2   2    3    4    5    6    palace   places          _20                 _up
                                       7                      specific
```

### Master Table: `registrations`

```sql
CREATE TABLE [registrations] (
    [application_id] INTEGER PRIMARY KEY AUTOINCREMENT,
    [session_id] TEXT UNIQUE,
    [created_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
    [status] TEXT DEFAULT 'draft',
    [current_step] TEXT DEFAULT 'main_html'
);
```

### Foreign Key Relationship

Every step table has an `application_id` column that references `registrations.application_id`:

```sql
-- Example: main_html table
CREATE TABLE [main_html] (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    [Registration Type] TEXT,
    [User Type] TEXT,
    ...
    [Session ID] TEXT,
    [application_id] INTEGER  -- FK -> registrations.application_id
);

-- Index for fast lookups
CREATE INDEX [idx_main_html_app] ON [main_html] ([application_id]);
```

### Tables with `application_id` FK

| Table | FK Column | Index |
|-------|-----------|-------|
| `main_html` | `application_id` | `idx_main_html_app` |
| `main` | `application_id` | `idx_main_app` |
| `otp` | `application_id` | `idx_otp_app` |
| `dash2` | `application_id` | `idx_dash2_app` |
| `otp2` | `application_id` | `idx_otp2_app` |
| `dash3` | `application_id` | `idx_dash3_app` |
| `dash4` | `application_id` | `idx_dash4_app` |
| `dash5` | `application_id` | `idx_dash5_app` |
| `dash6` | `application_id` | `idx_dash6_app` |
| `dash7` | `application_id` | `idx_dash7_app` |
| `principlepalace` | `application_id` | `idx_principlepalace_app` |
| `additionalplaces` | `application_id` | `idx_additionalplaces_app` |
| `goods` | `application_id` | `idx_goods_app` |
| `state_20specific` | `application_id` | `idx_state_20specific_app` |
| `adhar` | `application_id` | `idx_adhar_app` |
| `loginpage` | `application_id` | `idx_loginpage_app` |
| `welcome` | `application_id` | `idx_welcome_app` |
| `test_up` | `application_id` | `idx_test_up_app` |

### Query Examples

```sql
-- Get all data for one registration (JOIN across all steps)
SELECT r.*, m.[Name], m.[Email], o.[Mobile OTP], d5.[Trade Name]
FROM registrations r
LEFT JOIN main_html m ON r.application_id = m.application_id
LEFT JOIN otp o ON r.application_id = o.application_id
LEFT JOIN dash5 d5 ON r.application_id = d5.application_id
WHERE r.application_id = 7;

-- List all registrations with their current step and main_html data
SELECT r.application_id, r.session_id, r.status, r.current_step,
       m.[Name], m.[Email], m.[Mobile]
FROM registrations r
LEFT JOIN main_html m ON r.application_id = m.application_id
ORDER BY r.application_id DESC;

-- Count registrations by status
SELECT status, COUNT(*) as count
FROM registrations
GROUP BY status;

-- Find incomplete registrations (stuck at a step)
SELECT application_id, session_id, current_step, created_at
FROM registrations
WHERE status = 'draft'
ORDER BY created_at DESC;
```

---

## Login Flow

### 1. LOGIN GST/loginPage.html

| Property | Value |
|----------|-------|
| **Title** | Login Page |
| **Heading** | "Goods and Services Tax" |
| **Purpose** | User enters username and password |

**Form Fields:**
- Username (text, required)
- Password (password, min 5 chars)

**API Calls:**
- `POST /api/login` - saves credentials

**Navigation:**
- REGISTER button -> `../REGISTER GST/MAIN.html`
- Login success -> `welcome.html`

**Validation:** Enabled when `?validate=1` or `window.VALIDATE` is set

---

### 2. LOGIN GST/welcome.html

| Property | Value |
|----------|-------|
| **Title** | Welcome Page |
| **Heading** | "Welcome [NAME] to GST Common Portal" |
| **Purpose** | Post-login landing page with return calendar and quick links |

**Navigation:**
- RETURN DASHBOARD -> `dashboard.html` (via `exportAndGo`)
- Menu items -> `dash2.html` (via `condash()`)

**Forms:** None

---

### 3. LOGIN GST/dashboard.html

| Property | Value |
|----------|-------|
| **Title** | Dashboard |
| **Heading** | "Ledger Balance" |
| **Purpose** | Taxpayer dashboard - IGST/CGST/SGST/CESS balances, turnover details |

**Form Elements:**
- Financial Year (select dropdown)

**Navigation:**
- FILE RETURNS / PAY TAX buttons (no handlers defined)

---

### 4. LOGIN GST/dash2.html

| Property | Value |
|----------|-------|
| **Title** | File Returns |
| **Heading** | "File Returns" |
| **Purpose** | GSTR-1, GSTR-2B, GSTR-3B, GSTR-2A filing cards |

**Form Elements:**
- Financial Year (select)
- Quarter (select)
- Period (select)

**Navigation:**
- Prepare / View / Download buttons per return type

---

## Registration Flow

### 5. REGISTER GST/MAIN.html

| Property | Value |
|----------|-------|
| **Title** | New Registration |
| **Heading** | "New Registration" |
| **Purpose** | Start new GST registration |

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Registration Type | radio (New Registration / TRN) | Yes |
| User Type | select (Tax Payer / GST Practitioner) | Yes |
| State | select (auto-populated) | Yes |
| District | select (auto-populated) | Yes |
| Business Name | text | Yes |
| PAN | text (format: A-Z{5}[0-9]{4}A) | Yes |
| Email | email | Yes |
| Mobile | number (10 digits, starts 6-9) | Yes |

**API Calls:**
- None (data exported via `exportAndGo` to next page)

**External Links:**
- GST Registration Tutorial: `https://tutorial.gst.gov.in/cbt/registration/gstregistration/course/story_html5.html`

**Navigation:**
- PROCEED -> `OTP.html`

---

### 6. REGISTER GST/OTP.html

| Property | Value |
|----------|-------|
| **Title** | OTP Verification |
| **Heading** | "Verify OTP" |
| **Purpose** | OTP verification for new registration |

**Form Fields:**
| Field | Type | Demo Value |
|-------|------|------------|
| Mobile OTP | text (6 digits) | 123456 |
| Email OTP | text (6 digits) | 654321 |

**Navigation:**
- BACK -> `MAIN.html`
- PROCEED -> `verify.html`

---

### 7. REGISTER GST/verify.html

| Property | Value |
|----------|-------|
| **Title** | Part A Success |
| **Heading** | "Part A submission success" |
| **Purpose** | Shows TRN number after successful Part A submission |

**Displayed Data:**
- TRN: `332300189520TRN`

**Navigation:**
- PROCEED -> `dash2.html`

**Forms:** None

---

### 8. REGISTER GST/dash2.html

| Property | Value |
|----------|-------|
| **Title** | TRN Login |
| **Heading** | "New Registration" |
| **Purpose** | Login with TRN number to continue saved application |

**Form Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Registration | radio | New Registration / TRN |
| TRN Number | text | Format: 12 chars + "TRN" |
| Captcha | text | Canvas-drawn, must match |

**API Calls:**
- `POST /api/export` - saves TRN data

**Navigation:**
- PROCEED -> `OTP2.html`

---

### 9. REGISTER GST/OTP2.html

| Property | Value |
|----------|-------|
| **Title** | OTP Verification (TRN) |
| **Heading** | "Verify OTP" |
| **Purpose** | OTP verification for TRN-based login |

**Form Fields:**
| Field | Type | Demo Value |
|-------|------|------------|
| Mobile/Email OTP | text (6 digits) | 123456 |

**Navigation:**
- BACK -> `dash2.html`
- PROCEED -> `dash3.html`

---

### 10. REGISTER GST/dash3.html

| Property | Value |
|----------|-------|
| **Title** | Saved Applications |
| **Heading** | "My Saved Applications" |
| **Purpose** | Dashboard showing draft applications (GST REG-01) |

**Navigation:**
- Application row action -> `dash5.html`

**Forms:** None

---

### 11. REGISTER GST/dash5.html

| Property | Value |
|----------|-------|
| **Title** | Business Details |
| **Heading** | "Details of your Business" |
| **Purpose** | Step 1 - Business information |

**Form Fields:**
| Field | Type |
|-------|------|
| Trade Name | text |
| Constitution of Business | select |
| Additional Trade Name | text |
| District | select |
| Casual Taxable Person | toggle |
| Composition Option | toggle |
| Type of Registration | select |
| Registration Number | text |
| Date of Registration | date |
| Document Upload | file |

**Navigation:**
- BACK -> `dash3.html`
- SAVE & CONTINUE -> `dash4.html`

---

### 12. REGISTER GST/dash4.html

| Property | Value |
|----------|-------|
| **Title** | Promoter/Partner Details |
| **Heading** | "Personal Information" / "Promoter/ Partners" |
| **Purpose** | Step 2 - Personal details of promoters/partners |

**Form Fields:**
| Category | Fields |
|----------|--------|
| Personal | First Name, Middle Name, Last Name, Father's Name, DOB, Mobile, Email |
| Identity | Gender (radio), Designation, DIN Number, Citizenship, PAN, Passport, Aadhaar |
| Address | Country, PIN, State, District, City, Road, Building, Flat, Floor, Landmark |
| Documents | Photo Upload |

**Navigation:**
- BACK -> `dash5.html`
- ADD NEW -> `dash41.html`
- SAVE & CONTINUE -> `dash6.html`

---

### 13. REGISTER GST/dash41.html

| Property | Value |
|----------|-------|
| **Title** | Add Promoter/Partner |
| **Heading** | "Promoter/ Partners" |
| **Purpose** | Add another promoter/partner (identical form to dash4) |

**Form Fields:** Same as dash4.html (all empty)

**Navigation:**
- BACK -> `dash5.html`
- ADD NEW -> `dash4.html`
- SAVE & CONTINUE -> `dash6.html`

---

### 14. REGISTER GST/dash6.html

| Property | Value |
|----------|-------|
| **Title** | Authorized Signatory |
| **Heading** | "Details of Authorized Signatory" |
| **Purpose** | Step 3 - Authorized signatory details |

**Form Fields:**
| Category | Fields |
|----------|--------|
| Personal | First Name, Middle Name, Last Name, Father's Name, DOB, Mobile, Email |
| Address | Country, PIN, State, District, City, Locality, Road, Building, Flat, Floor, Landmark |
| Documents | Photo Upload, Proof of Signatory (select) |

**Navigation:**
- BACK -> `dash4.html`
- SAVE & CONTINUE -> `dash7.html`

---

### 15. REGISTER GST/dash7.html

| Property | Value |
|----------|-------|
| **Title** | Authorized Representative |
| **Heading** | "Details of Authorized Representative" |
| **Purpose** | Step 4 - Toggle to add authorized representative |

**Form Elements:**
- Authorized Representative (toggle/checkbox)

**Navigation:**
- BACK -> `dash6.html`
- SAVE & CONTINUE -> `principlepalace.html`

---

### 16. REGISTER GST/principlepalace.html

| Property | Value |
|----------|-------|
| **Title** | Principal Place of Business |
| **Heading** | "Details of Principle Place of Business" |
| **Purpose** | Step 5 - Principal business location |

**Form Fields:**
| Category | Fields |
|----------|--------|
| Address | PIN, State, District, City, Locality, Road, Building, Flat, Floor, Landmark |
| Coordinates | Latitude, Longitude |
| Jurisdiction | Jurisdiction, Commissionaire, Division, Range |
| Contact | Office Email, Telephone, Mobile, FAX |
| Possession | Nature of Possession, Proof of Place (select), File Upload |
| Activities | Bonded Warehouse, EOU, Export, Factory, Import, Services, Leasing, Office, Retail, Warehouse, Wholesale, Works Contract, Others (checkboxes) |

**Navigation:**
- BACK -> `dash7.html`
- SAVE & CONTINUE -> `additionalplaces.html`

---

### 17. REGISTER GST/additionalplaces.html

| Property | Value |
|----------|-------|
| **Title** | Additional Places |
| **Heading** | "Details of Additional Places of your Business" |
| **Purpose** | Step 6 - Info page for adding more business locations |

**Forms:** None (info/instructions only)

**Navigation:**
- BACK -> `principlepalace.html`
- CONTINUE -> `goods.html`

---

### 18. REGISTER GST/goods.html

| Property | Value |
|----------|-------|
| **Title** | Goods & Services |
| **Heading** | "Details of Goods / Commodities supplied by the business" |
| **Purpose** | Step 7 - HSN code search for top 5 commodities |

**Form Fields:**
- HSN Chapter (text search)

**Navigation:**
- BACK -> `additionalplaces.html`
- SAVE & CONTINUE -> `state specific.html`

---

### 19. REGISTER GST/state specific.html

| Property | Value |
|----------|-------|
| **Title** | State Specific Info |
| **Heading** | State Specific Information |
| **Purpose** | Step 8 - State-specific registrations |

**Form Fields:**
| Field | Type |
|-------|------|
| Professional Tax EC Number | number |
| State Excise License Number | number |
| Professional Tax RC Number | number |
| Excise License Holder Name | text |

**Navigation:**
- BACK -> `goods.html`
- SAVE & CONTINUE -> `adhar.html`

---

### 20. REGISTER GST/adhar.html

| Property | Value |
|----------|-------|
| **Title** | Aadhaar Authentication |
| **Heading** | "Aadhaar Authentication" |
| **Purpose** | Step 9 - Select promoters for Aadhaar verification |

**Forms:** Table with checkboxes (empty rows)

**Navigation:**
- BACK -> `state specific.html`
- SAVE & CONTINUE -> `verification.html`

---

### 21. REGISTER GST/verification.html

| Property | Value |
|----------|-------|
| **Title** | Final Verification |
| **Heading** | "Verification" |
| **Purpose** | Step 10 - Declaration and final submission |

**Form Fields:**
| Field | Type |
|-------|------|
| Declaration | checkbox (required) |
| Authorized Signatory | select |
| Place | text |
| Designation | textarea |
| Date | date |

**Navigation:**
- BACK -> `adhar.html`
- SUBMIT WITH DSC
- SUBMIT WITH EVC

---

## Navigation Flow

### Login Flow
```
loginPage.html
    |
    v
welcome.html -----> dashboard.html
    |
    v
dash2.html (File Returns)
```

### Registration Flow
```
MAIN.html (New Registration)
    |
    v
OTP.html
    |
    v
verify.html (TRN: 332300189520TRN)
    |
    v
dash2.html (TRN Login)
    |
    v
OTP2.html
    |
    v
dash3.html (Saved Applications)
    |
    v
dash5.html (Business Details - Step 1)
    |
    v
dash4.html (Promoter/Partner - Step 2) <--> dash41.html (Add New)
    |
    v
dash6.html (Authorized Signatory - Step 3)
    |
    v
dash7.html (Authorized Rep - Step 4)
    |
    v
principlepalace.html (Principal Place - Step 5)
    |
    v
additionalplaces.html (Additional Places - Step 6)
    |
    v
goods.html (Goods/Services - Step 7)
    |
    v
state specific.html (State Info - Step 8)
    |
    v
adhar.html (Aadhaar Auth - Step 9)
    |
    v
verification.html (Final Submit - Step 10)
```

### Header Navigation (All Pages)
```
[REGISTER] -> MAIN.html
[LOGIN]    -> loginPage.html
```

---

## Shared Scripts

| File | Purpose |
|------|---------|
| `form-exporter.js` | Intercepts form data on every page, POSTs to `/api/export` before navigation |
| `query.js` | CLI tool: `node query.js "SELECT * FROM table"` |
| `style.css` | Styles for MAIN.html |
| `style2.css` | Shared styles for registration flow (dash3-dash7, adhar, goods, etc.) |

### form-exporter.js Functions

| Function | Purpose |
|----------|---------|
| `getSessionId()` | Gets/creates UUID in localStorage (`gst_session_id`) |
| `getApplicationId()` | Gets `application_id` from localStorage (`gst_application_id`) |
| `setApplicationId(id)` | Stores `application_id` in localStorage |
| `exportAndGo(url)` | Collects form fields, POSTs to API, stores `application_id` from response, navigates to URL |
| `goWithValidate(url)` | Navigates to URL, preserves `?validate=1` param |

---

## Database Tables

| Table | Records | Purpose | Foreign Key |
|-------|---------|---------|-------------|
| `registrations` | 7 | Master registration records | **PK: application_id** |
| `main_html` | 38 | Registration form submissions | `application_id` -> `registrations` |
| `loginpage` | 34 | Login credentials (hashed) | `application_id` -> `registrations` |
| `otp` | - | OTP verification data | `application_id` -> `registrations` |
| `otp2` | - | Second OTP data | `application_id` -> `registrations` |
| `dash2`-`dash7` | - | Registration step data | `application_id` -> `registrations` |
| `principlepalace` | - | Principal place data | `application_id` -> `registrations` |
| `additionalplaces` | - | Additional places data | `application_id` -> `registrations` |
| `goods` | - | Goods/services data | `application_id` -> `registrations` |
| `state_20specific` | - | State-specific info | `application_id` -> `registrations` |
| `adhar` | - | Aadhaar auth data | `application_id` -> `registrations` |
| `welcome` | - | Welcome page data | `application_id` -> `registrations` |
| `main` | - | Legacy table | `application_id` -> `registrations` |
| `test_up` | - | Test upload data | `application_id` -> `registrations` |

---

## Quick Reference

### View Data (Browser)
```
http://localhost:4000/view?table=registrations
http://localhost:4000/view?table=main_html
http://localhost:4000/view?table=loginpage
```

### Query Data (Terminal)
```bash
# List all tables
node query.js "SELECT name FROM sqlite_master WHERE type='table'"

# View registrations
node query.js "SELECT * FROM registrations"

# View main_html
node query.js "SELECT * FROM main_html"

# View loginpage
node query.js "SELECT * FROM loginpage"

# JOIN: Get registration with linked data
node query.js "SELECT r.application_id, r.session_id, r.status, m.Name, m.Email FROM registrations r LEFT JOIN main_html m ON r.application_id = m.application_id ORDER BY r.application_id DESC"

# Find incomplete registrations
node query.js "SELECT application_id, session_id, current_step, status FROM registrations WHERE status = 'draft'"
```

### API Quick Reference
```bash
# List all registrations
curl http://localhost:4000/api/registrations

# Get registration by session ID
curl "http://localhost:4000/api/registration?session_id=test-fk-001"

# Get registration with all linked step data
curl http://localhost:4000/api/registration/7
```

### Demo OTP Values
- New Registration Mobile OTP: `123456`
- New Registration Email OTP: `654321`
- TRN Login OTP: `123456`

### Default Admin Account
- Username: `admin`
- Password: `admin`

---

*Document generated for GST Website v1.0.0 — Updated with registrations schema*
