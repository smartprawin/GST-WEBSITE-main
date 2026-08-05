---
name: auto-documenter
description: >
  Use this skill when the user asks to document changes, update documentation, generate docs,
  create project documentation, or after making code changes that need to be documented.
  Trigger on phrases like "document this", "update the docs", "generate documentation",
  "what changed", "create documentation file", "document the new features", "add to docs",
  or any task involving creating or updating project documentation after code modifications.
  This skill automatically detects whether documentation exists and either updates it or
  creates new documentation from scratch based on codebase analysis.
---

# Auto-Documenter

Automatically detects codebase changes and creates or updates project documentation. Supports two modes:

- **Update Mode**: Documentation file exists → read it, identify gaps, make targeted edits
- **Create Mode**: No documentation file → scan codebase, generate comprehensive docs from scratch

## Workflow

When invoked, follow these phases in order:

### Phase 1: Detect Documentation Mode

**Step 1: Find existing documentation**

Search for documentation files in the project root and common locations:

```
Patterns to search (in order of priority):
1. *-DOCUMENTATION.md or *-DOCS.md (e.g., GST-WEBSITE-DOCUMENTATION.md)
2. docs/*.md or documentation/*.md
3. README.md (if it contains substantial documentation)
4. *.md files with "documentation" or "docs" in the name
```

Use glob to find candidates:
```
**/*DOCUMENTATION*.md
**/*DOCS*.md
**/docs/**/*.md
**/documentation/**/*.md
README.md
```

**Step 2: Determine mode**

| Condition | Mode | Action |
|-----------|------|--------|
| Documentation file found | **UPDATE** | Read existing doc, scan for changes, update targeted sections |
| No documentation found | **CREATE** | Scan entire codebase, generate new documentation file |

### Phase 2: Scan Codebase for Changes

Regardless of mode, analyze the current state of the codebase.

**What to scan:**

| File Type | What to Extract |
|-----------|-----------------|
| `server.js` | Routes, API endpoints, middleware, database setup |
| `*.html` | Pages, forms, fields, navigation links, JS calls |
| `*.js` (client) | API calls, functions, localStorage usage |
| `package.json` | Dependencies, scripts, project metadata |
| `*.sql` | Database schema, migrations |
| `*.css` | Styles (summarize, don't copy) |
| SQLite database | Table names, column names, record counts |

**Extraction approach:**

1. **Routes & API**: Read `server.js`, extract all `app.get()`, `app.post()`, middleware
2. **HTML Pages**: For each `.html` file, extract title, heading, form fields, links, API calls
3. **Database**: Query `sqlite_master` for table schemas, count records
4. **Scripts**: Read `.js` files, extract function names, exports, API URLs
5. **Dependencies**: Read `package.json` for project config

### Phase 3: Update Mode (Documentation Exists)

**Step 3a: Read existing documentation**

Read the full documentation file. Identify:
- Current sections and their content
- What's already documented
- What's missing or outdated

**Step 3b: Diff analysis**

Compare scanned codebase state against existing documentation:

| Check | What to Look For |
|-------|------------------|
| New API endpoints | Routes in server.js not in docs |
| New HTML pages | .html files not listed in docs |
| New database tables | Tables in SQLite not in docs |
| Changed form fields | Input fields in HTML that differ from docs |
| New dependencies | Packages in package.json not in docs |
| Removed items | Items in docs but no longer in codebase |

**Step 3c: Targeted updates**

Make surgical edits to the existing documentation:
- Add new sections for new features
- Update changed sections (e.g., new form fields, new API params)
- Remove or mark deprecated items
- Update record counts and examples
- Preserve existing structure and formatting

**Important rules for Update Mode:**
- NEVER rewrite the entire file — only edit what changed
- Preserve the existing documentation style and structure
- Add a "Last Updated" timestamp at the top or bottom
- If the file has version notes, add a new entry

### Phase 4: Create Mode (No Documentation Exists)

**Step 4a: Choose documentation file name**

Follow the project naming convention. If unsure, use:
```
<PROJECT-NAME>-DOCUMENTATION.md
```

For example:
- Project in `GST-WEBSITE-main/` → `GST-WEBSITE-DOCUMENTATION.md`
- Project in `my-app/` → `MY-APP-DOCUMENTATION.md`

**Step 4b: Generate documentation structure**

Use this template as the base structure:

```markdown
# [Project Name] - Complete Documentation

> Auto-generated documentation of all pages, routes, and API endpoints.

---

## Table of Contents

1. [Server Routes](#server-routes)
2. [API Endpoints](#api-endpoints)
3. [Database Schema](#database-schema)
4. [Pages](#pages)
5. [Navigation Flow](#navigation-flow)
6. [Shared Scripts](#shared-scripts)

---

## Server Routes

[Extracted from server.js]

## API Endpoints

[Extracted from server.js route handlers]

## Database Schema

[Extracted from SQLite tables]

## Pages

[Extracted from .html files]

## Navigation Flow

[Derived from links and JS navigation]

## Shared Scripts

[Extracted from .js files]

---

*Auto-generated for [Project Name]*
```

**Step 4c: Populate each section**

For each section, extract data from the codebase and format it consistently.

**Server Routes table format:**
```markdown
| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/path` | Description |
```

**API Endpoints format:**
```markdown
### METHOD /api/endpoint-name

Description of what it does.

// Request
{ ... }

// Response
{ ... }
```

**Database Tables format:**
```markdown
| Table | Records | Purpose |
|-------|---------|---------|
| `table_name` | N | Description |
```

**HTML Pages format:**
```markdown
### N. path/to/page.html

| Property | Value |
|----------|-------|
| **Title** | Page title |
| **Purpose** | What it does |

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Field Name | input type | Yes/No |

**API Calls:**
- `METHOD /api/endpoint` - description

**Navigation:**
- Button Label -> `target.html`
```

**Step 4d: Write the documentation file**

Write the complete documentation to the project root.

### Phase 5: Report

Provide a summary of what was documented:

```
Documentation Mode: UPDATE | CREATE
File: <path-to-documentation-file>

Changes:
  [+] Added: <section or item>
  [~] Updated: <section or item>
  [-] Removed: <section or item>

Sections:
  - Server Routes: N routes documented
  - API Endpoints: N endpoints documented
  - Database: N tables documented
  - Pages: N pages documented
```

## Edge Cases

**Multiple documentation files:**
If multiple doc files exist, prefer the one most recently modified. If they cover different aspects (e.g., API docs vs. user guide), update the most relevant one and mention the others in the report.

**Large codebases:**
If the project has hundreds of files, focus on the core files (server, main pages, database) and summarize others. Don't try to document every single file — prioritize what's important.

**No server.js or backend:**
If the project is frontend-only, focus on pages, components, and their relationships. Skip server/API sections.

**Existing README with docs:**
If README.md contains substantial documentation (not just a brief intro), treat it as the target file for updates.

## Platform Notes

This skill is platform-agnostic. It works with:
- Node.js/Express servers
- Python/Flask/Django servers
- Static HTML sites
- Any project with documentation needs

The scanning logic adapts based on what files exist in the project.
