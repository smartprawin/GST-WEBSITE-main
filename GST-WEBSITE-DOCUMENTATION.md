# GST Website - Complete Page & Route Reference

> Auto-generated documentation of all pages, links, forms, and API endpoints.
> **Last Updated:** 2026-08-07 — Added SEO optimization, index.html as home page, data flow fixes

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Server Routes](#server-routes)
3. [API Endpoints](#api-endpoints)
4. [Database Schema & Relationships](#database-schema--relationships)
5. [Login Flow Pages](#login-flow)
6. [Registration Flow Pages](#registration-flow)
7. [Navigation Flow Diagrams](#navigation-flow)
8. [Shared Scripts](#shared-scripts)
9. [Database Tables](#database-tables)
10. [SEO Features](#seo-features)

---

## Project Structure

```
GST-WEBSITE-main/
├── src/
│   ├── server.js                    ← Express server (main entry)
│   └── db/
│       └── migrations/
│           ├── migrate.sql          ← Schema migration SQL
│           ├── run-migration.js     ← Migration runner
│           └── create-registrations.js
├── public/
│   ├── form-exporter.js             ← Client-side form collector
│   ├── query.js                     ← CLI database query tool
│   ├── robots.txt                   ← SEO: Crawler directives
│   ├── sitemap.xml                  ← SEO: XML sitemap
│   ├── 404.html                     ← Custom 404 error page
│   ├── css/
│   │   ├── style.css                ← MAIN.html + landing page styles
│   │   └── style2.css               ← Registration flow styles
│   ├── images/
│   │   ├── gst.png
│   │   └── sa.png
│   ├── js/
│   │   ├── video-ad.js
│   │   └── adblocker-detect.js
│   ├── login/                       ← Login flow pages
│   │   ├── loginPage.html
│   │   ├── welcome.html
│   │   ├── dashboard.html
│   │   └── dash2.html
│   ├── register/                    ← Registration flow pages
│   │   ├── index.html               ← HOME PAGE (landing page with news, help topics)
│   │   ├── MAIN.html                ← Registration form only
│   │   ├── Registerpage.html        ← Legacy registration form
│   │   ├── OTP.html, OTP2.html
│   │   ├── verify.html
│   │   ├── dash2.html - dash7.html
│   │   ├── principlepalace.html
│   │   ├── additionalplaces.html
│   │   ├── goods.html
│   │   ├── state specific.html
│   │   ├── adhar.html
│   │   ├── verification.html
│   │   └── registration-summary.html
│   ├── privacy-policy.html
│   └── trnlogin.html.html
├── data/
│   └── data.sqlite                  ← SQLite database
├── logs/
│   ├── server.err
│   └── server.log
├── .env                             ← Environment config
├── .gitignore
├── package.json
└── GST-WEBSITE-DOCUMENTATION.md
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start production server |
| `npm run dev` | Start with auto-reload (--watch) |
| `npm run migrate` | Run database migration |
| `npm run query "SELECT..."` | Query database |

### Environment Variables (.env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 4000 | Server port |
| `DB_PATH` | ./data/data.sqlite | Database file path |
| `LOG_PATH` | ./logs | Log directory |

---

## Server Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/` | Redirects to `/register/index.html` (home page) |
| `GET` | `*` (middleware) | Injects "DEMO WEBSITE" banner + `window.VALIDATE` script into all `.html` pages |
| `GET` | `*` (static) | Serves all root-level static files (HTML, CSS, JS, images) |
| `GET` | `*` (404) | Serves custom `404.html` page for unmatched routes |
| `POST` | `/api/export` | Saves form data to SQLite (upserts by Session ID, links to registration) |
| `POST` | `/api/login` | Saves hashed login credentials to `loginpage` table |
| `GET` | `/api/registrations` | List all registrations |
| `GET` | `/api/registration?session_id=X` | Get registration by session ID |
| `GET` | `/api/registration/:id` | Get registration + all linked step data |
| `GET` | `/view?table=<name>` | Admin data viewer - displays SQLite table as HTML |

**Port:** 4000  
**Database:** `data/data.sqlite` (SQLite, WAL mode, foreign keys ON)  
**Server Entry:** `src/server.js`

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
      "dash5": { ... },
      "verification": { "Declaration": "Yes", "Place": "...", ... }
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
- `http://localhost:4000/view?table=verification`

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
         +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
         |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
         v  v  v  v  v  v  v  v  v  v  v  v  v  v  v  v  v  v
       main otp dash dash dash dash dash principle additional goods state adhar login welcome test verification
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
| `verification` | `application_id` | `idx_verification_app` |

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

### 1. public/login/loginPage.html

| Property | Value |
|----------|-------|
| **Title** | Login - GST Demo Portal |
| **Meta Description** | Login to your GST Demo account. Access your GST registration dashboard, file returns and manage your tax profile. |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | User enters username and password |
| **Canonical** | https://gstdemo.example.com/login/loginPage.html |

**Form Fields:**
- Username (text, required)
- Password (password, min 5 chars)

**API Calls:**
- `POST /api/login` - saves credentials

**Navigation:**
- REGISTER button -> `../register/MAIN.html`
- Login success -> `welcome.html`
- Home button -> `../register/index.html`

**Validation:** Enabled when `?validate=1` or `window.VALIDATE` is set

---

### 2. public/login/welcome.html

| Property | Value |
|----------|-------|
| **Title** | Welcome - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Post-login landing page with return calendar and quick links |

**Navigation:**
- RETURN DASHBOARD -> `dashboard.html` (via `exportAndGo`)
- Menu items -> `dash2.html` (via `condash()`)
- Home button -> `../register/index.html`

**Forms:** None

---

### 3. public/login/dashboard.html

| Property | Value |
|----------|-------|
| **Title** | Dashboard - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Taxpayer dashboard - IGST/CGST/SGST/CESS balances, turnover details |

**Form Elements:**
- Financial Year (select dropdown)

**Navigation:**
- FILE RETURNS / PAY TAX buttons (no handlers defined)
- Home button -> `../register/index.html`

---

### 4. public/login/dash2.html

| Property | Value |
|----------|-------|
| **Title** | Profile - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | GSTR-1, GSTR-2B, GSTR-3B, GSTR-2A filing cards |

**Form Elements:**
- Financial Year (select)
- Quarter (select)
- Period (select)

**Navigation:**
- Prepare / View / Download buttons per return type
- Home button -> `../register/index.html`

---

## Registration Flow

### 5. public/register/index.html (HOME PAGE)

| Property | Value |
|----------|-------|
| **Title** | GST Demo - Goods and Services Tax Registration Portal |
| **Meta Description** | GST Demo: Register for Goods and Services Tax (GST) online. Complete your GST registration, file returns, and manage your tax compliance easily. |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Landing page with news, help topics, due dates, and registration/login links |
| **Canonical** | https://gstdemo.example.com/register/index.html |
| **Schema.org** | GovernmentOrganization |

**Content Sections:**
- Services dropdown navigation
- GST Banner image
- New Updates (news cards)
- Popular Help Topics
- Upcoming Due Dates table
- Contact box (Help-Desk, Grievance Redressal)

**Navigation:**
- REGISTER button -> `MAIN.html`
- LOGIN button -> `../login/loginPage.html`
- Home button -> `index.html` (self)

---

### 6. public/register/MAIN.html

| Property | Value |
|----------|-------|
| **Title** | New GST Registration - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Start new GST registration (form only, no landing page content) |

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

**Navigation:**
- PROCEED -> `OTP.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 7. public/register/Registerpage.html

| Property | Value |
|----------|-------|
| **Title** | Register - GST Demo Portal |
| **Heading** | "GST DEMO" (h1) |
| **Purpose** | Legacy registration form (same fields as MAIN.html) |

**Form Fields:** Same as MAIN.html (properly named attributes)

**Navigation:**
- PROCEED -> `OTP.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 8. public/register/OTP.html

| Property | Value |
|----------|-------|
| **Title** | OTP Verification - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | OTP verification for new registration |

**Form Fields:**
| Field | Type | Demo Value |
|-------|------|------------|
| Mobile OTP | text (6 digits) | 123456 |
| Email OTP | text (6 digits) | 654321 |

**Navigation:**
- BACK -> `MAIN.html`
- PROCEED -> `verify.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 9. public/register/verify.html

| Property | Value |
|----------|-------|
| **Title** | Registration Submitted - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Shows TRN number after successful Part A submission |

**Displayed Data:**
- TRN: `332300189520TRN`

**Navigation:**
- PROCEED -> `dash2.html`
- Home button -> `index.html`

---

### 10. public/register/dash2.html

| Property | Value |
|----------|-------|
| **Title** | Part B Registration - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Login with TRN number to continue saved application |

**Form Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Registration | radio | New Registration / TRN |
| TRN Number | text | Format: 12 chars + "TRN" |
| Captcha | text | Canvas-drawn, must match |

**API Calls:**
- `POST /api/export` - saves TRN data (via `saveTrnAndGo`)

**Navigation:**
- PROCEED -> `OTP2.html`
- Home button -> `index.html`

---

### 11. public/register/OTP2.html

| Property | Value |
|----------|-------|
| **Title** | OTP Confirmation - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | OTP verification for TRN-based login |

**Form Fields:**
| Field | Type | Demo Value |
|-------|------|------------|
| Mobile/Email OTP | text (6 digits) | 123456 |

**Navigation:**
- BACK -> `dash2.html`
- PROCEED -> `dash3.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 12. public/register/dash3.html

| Property | Value |
|----------|-------|
| **Title** | My Saved Applications - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Dashboard showing draft applications (GST REG-01) |

**Navigation:**
- Application row action -> `dash5.html`
- Home button -> `index.html`

---

### 13. public/register/dash5.html

| Property | Value |
|----------|-------|
| **Title** | Business Details - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
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
- SAVE & CONTINUE -> `dash4.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 14. public/register/dash4.html

| Property | Value |
|----------|-------|
| **Title** | Promoter / Partner Details - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
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
- SAVE & CONTINUE -> `dash6.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 15. public/register/dash41.html

| Property | Value |
|----------|-------|
| **Title** | Add Promoter / Partner - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Add another promoter/partner (identical form to dash4) |

**Form Fields:** Same as dash4.html (all empty)

**Navigation:**
- BACK -> `dash5.html`
- ADD NEW -> `dash4.html`
- SAVE & CONTINUE -> `dash6.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 16. public/register/dash6.html

| Property | Value |
|----------|-------|
| **Title** | Authorized Signatory - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Step 3 - Authorized signatory details |

**Form Fields:**
| Category | Fields |
|----------|--------|
| Personal | First Name, Middle Name, Last Name, Father's Name, DOB, Mobile, Email |
| Address | Country, PIN, State, District, City, Locality, Road, Building, Flat, Floor, Landmark |
| Documents | Photo Upload, Proof of Signatory (select) |

**Navigation:**
- BACK -> `dash4.html`
- SAVE & CONTINUE -> `dash7.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 17. public/register/dash7.html

| Property | Value |
|----------|-------|
| **Title** | Authorized Representative - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Step 4 - Toggle to add authorized representative |

**Form Elements:**
- Authorized Representative (toggle/checkbox)

**Navigation:**
- BACK -> `dash6.html`
- SAVE & CONTINUE -> `principlepalace.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 18. public/register/principlepalace.html

| Property | Value |
|----------|-------|
| **Title** | Principal Place of Business - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
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
- SAVE & CONTINUE -> `additionalplaces.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 19. public/register/additionalplaces.html

| Property | Value |
|----------|-------|
| **Title** | Additional Places of Business - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Step 6 - Info page for adding more business locations |

**Forms:** None (info/instructions only)

**Navigation:**
- BACK -> `principlepalace.html`
- CONTINUE -> `goods.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 20. public/register/goods.html

| Property | Value |
|----------|-------|
| **Title** | Goods and Services - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Step 7 - HSN code search for top 5 commodities |

**Form Fields:**
- HSN Chapter (text search)

**Navigation:**
- BACK -> `additionalplaces.html`
- SAVE & CONTINUE -> `state specific.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 21. public/register/state specific.html

| Property | Value |
|----------|-------|
| **Title** | State Specific Information - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
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
- SAVE & CONTINUE -> `adhar.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 22. public/register/adhar.html

| Property | Value |
|----------|-------|
| **Title** | Aadhaar Authentication - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Step 9 - Select promoters for Aadhaar verification |

**Forms:** Table with checkboxes (empty rows)

**Navigation:**
- BACK -> `state specific.html`
- SAVE & CONTINUE -> `verification.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 23. public/register/verification.html

| Property | Value |
|----------|-------|
| **Title** | Verification & Submit - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
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
- SUBMIT WITH DSC -> `registration-summary.html` (via `exportAndGo`)
- SUBMIT WITH EVC -> `registration-summary.html` (via `exportAndGo`)
- Home button -> `index.html`

---

### 24. public/register/registration-summary.html

| Property | Value |
|----------|-------|
| **Title** | Registration Summary - GST Demo Portal |
| **Heading** | "GST Demo" (h1) |
| **Purpose** | Read-only summary of all registration data |

**Data Displayed:**
- Registration Info (ID, session, status, step, dates)
- New Registration Details (from main_html)
- OTP Verification (from otp)
- Business Details (from dash5)
- Promoter/Partner (from dash4)
- Authorized Signatory (from dash6)
- Principal Place (from principlepalace)
- Goods/Services (from goods)
- State Specific (from state_20specific)
- Login Credentials (from loginpage)
- Verification (from verification)

**API Calls:**
- `GET /api/registration/:id` or `GET /api/registration?session_id=X`

---

## Navigation Flow

### Home Page Access
```
Any Page --[Home button]--> index.html (landing page)
```

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
index.html (Home/Landing)
    |
    +--[REGISTER]--> MAIN.html (New Registration)
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
                        |
                        v
                    registration-summary.html (Summary)
```

### Header Navigation (All Pages)
```
[Home]     -> index.html
[REGISTER] -> MAIN.html
[LOGIN]    -> loginPage.html
```

---

## Shared Scripts

| File | Purpose |
|------|---------|
| `form-exporter.js` | Intercepts form data on every page, POSTs to `/api/export` before navigation |
| `query.js` | CLI tool: `node query.js "SELECT * FROM table"` |
| `video-ad.js` | Video ad integration |
| `adblocker-detect.js` | Detects ad blockers |
| `style.css` | MAIN.html + index.html + landing page styles |
| `style2.css` | Shared styles for registration flow (dash3-dash7, adhar, goods, etc.) |

### form-exporter.js Functions

| Function | Purpose |
|----------|---------|
| `getSessionId()` | Gets/creates UUID in localStorage (`gst_session_id`) |
| `getApplicationId()` | Gets `application_id` from localStorage (`gst_application_id`) |
| `setApplicationId(id)` | Stores `application_id` in localStorage |
| `exportAndGo(url)` | Collects form fields, POSTs to API (waits for response), stores `application_id`, then navigates |
| `goWithValidate(url)` | Navigates to URL, preserves `?validate=1` param |
| `goBack()` | Navigates back in history |

**Key Behavior:** `exportAndGo()` now waits for the fetch to complete before navigating, preventing data loss from race conditions.

---

## Database Tables

| Table | Records | Purpose | Foreign Key |
|-------|---------|---------|-------------|
| `registrations` | 13+ | Master registration records | **PK: application_id** |
| `main_html` | 38+ | Registration form submissions | `application_id` -> `registrations` |
| `loginpage` | 34+ | Login credentials (hashed) | `application_id` -> `registrations` |
| `otp` | - | OTP verification data | `application_id` -> `registrations` |
| `otp2` | - | Second OTP data | `application_id` -> `registrations` |
| `dash2`-`dash7` | - | Registration step data | `application_id` -> `registrations` |
| `principlepalace` | - | Principal place data | `application_id` -> `registrations` |
| `additionalplaces` | - | Additional places data | `application_id` -> `registrations` |
| `goods` | - | Goods/services data | `application_id` -> `registrations` |
| `state_20specific` | - | State-specific info | `application_id` -> `registrations` |
| `adhar` | - | Aadhaar auth data | `application_id` -> `registrations` |
| `verification` | - | Final verification/submit data | `application_id` -> `registrations` |
| `welcome` | - | Welcome page data | `application_id` -> `registrations` |
| `main` | - | Legacy table | `application_id` -> `registrations` |
| `test_up` | - | Test upload data | `application_id` -> `registrations` |

---

## SEO Features

### Meta Tags (All Pages)

Every HTML page includes:

| Tag | Purpose |
|-----|---------|
| `<title>` | Unique descriptive page title (e.g., "Login - GST Demo Portal") |
| `<meta name="description">` | Search snippet text (150-160 chars) |
| `<meta name="keywords">` | Relevant search keywords |
| `<link rel="canonical">` | Prevents duplicate content indexing |
| `<meta property="og:title">` | Open Graph title for social sharing |
| `<meta property="og:description">` | Open Graph description for social sharing |
| `<meta property="og:type">` | Open Graph content type |

### Structured Data (JSON-LD)

`index.html` includes Schema.org structured data:

```json
{
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": "GST Demo",
    "url": "https://gstdemo.example.com",
    "description": "Goods and Services Tax Registration Portal - Demo"
}
```

### Site-wide SEO Files

| File | Purpose |
|------|---------|
| `robots.txt` | Tells crawlers which pages to index |
| `sitemap.xml` | Lists all pages for search engine discovery |
| `404.html` | Custom error page (also handles `noindex` for error pages) |

### Heading Hierarchy

All pages use proper heading hierarchy:
- `<h1>GST Demo</h1>` - Site title in header (single h1 per page)
- `<h2>` - Section headings
- `<h3>` - Sub-section headings

### Image Alt Text

All images include descriptive `alt` attributes:
- `gst.png` → "GST Demo - Goods and Services Tax Portal Banner"
- `sa.png` → "Dashboard"
- Map images → "Location map for business address"

---

## Quick Reference

### View Data (Browser)
```
http://localhost:4000/view?table=registrations
http://localhost:4000/view?table=main_html
http://localhost:4000/view?table=loginpage
http://localhost:4000/view?table=verification
```

### Query Data (Terminal)
```bash
# From project root
npm run query "SELECT * FROM registrations"
npm run query "SELECT * FROM main_html"
npm run query "SELECT name FROM sqlite_master WHERE type='table'"

# Or directly
node public/query.js "SELECT * FROM registrations"
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

*Auto-generated for GST Website v2.0.0 — Updated with SEO optimization, index.html home page, data flow fixes, and verification table support*
