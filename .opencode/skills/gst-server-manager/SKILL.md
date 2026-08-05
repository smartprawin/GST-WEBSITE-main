---
name: gst-server-manager
description: >
  Use this skill when the user wants to start, stop, restart, verify, debug, or health-check a Node.js/Express server.
  Trigger on phrases like "start the server", "run the backend", "check server status", "fix server errors",
  "is the server running", "invoke the server", "bootstrap the app", "server won't start", "port already in use",
  or any task involving launching, validating, or troubleshooting a Node.js HTTP server. This skill performs
  full health checks (dependency verification, port conflict detection, error log analysis, API endpoint testing)
  and auto-fixes common issues (missing deps, port conflicts, stale processes).
---

# GST Server Manager

A comprehensive Node.js server lifecycle manager that verifies, starts, health-checks, and auto-fixes Express/HTTP servers.

## Workflow

When invoked, follow these steps in order. Report progress to the user after each phase.

### Phase 1: Pre-flight Checks

Run these checks sequentially and report results. If any check fails, attempt auto-fix before proceeding.

#### 1.1 Verify Node.js Installation

```powershell
node --version
```

- If this fails: inform the user Node.js is not installed and stop. Do NOT attempt to install Node.js.
- If it succeeds: note the version and proceed.

#### 1.2 Check Dependencies

```powershell
npm ls 2>&1
```

Run from the project root (where `package.json` lives).

- If `node_modules/` is missing or `npm ls` shows missing packages: run `npm install` and report the result.
- If `package.json` does not exist: inform the user and stop.
- Otherwise: report "All dependencies satisfied" and proceed.

#### 1.3 Detect Port Conflicts

Read the `PORT` value from `server.js` (or `package.json` scripts). The default is usually 4000 or 3000.

```powershell
netstat -ano | findstr :<PORT>
```

- If a process is listening: check if it's our server. If yes, report "Server already running on port <PORT>" and skip to Phase 3 (Health Check). If it's a different process, attempt to kill it:
  ```powershell
  taskkill /PID <PID> /F
  ```
  Then report "Killed stale process on port <PORT>".

- If port is free: proceed.

#### 1.4 Check Error Logs

Look for `.err` files in the project root (e.g., `server.err`, `server_run.err`).

- If recent errors exist (within last 24 hours): read and display the last 5-10 lines. Ask the user if they want to continue or investigate first.
- If no error files: proceed silently.

### Phase 2: Start Server

Start the server using the project's start script or direct node invocation.

**Option A: npm start** (preferred if `package.json` has a start script)
```powershell
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start" -WorkingDirectory "<project_root>" -RedirectStandardOutput "server.log" -RedirectStandardError "server.err"
```

**Option B: Direct node** (fallback)
```powershell
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "<project_root>" -RedirectStandardOutput "server.log" -RedirectStandardError "server.err"
```

Wait 3-5 seconds for the server to boot, then verify:

```powershell
netstat -ano | findstr :<PORT>
```

- If listening: report success with PID and URL.
- If not listening: check `server.err` for startup errors and attempt auto-fix (see Phase 4).

### Phase 3: Health Check

After server is confirmed running, perform these checks:

#### 3.1 HTTP Connectivity

```powershell
(Invoke-WebRequest -Uri http://localhost:<PORT>/ -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode
```

Note: "Cannot GET /" is normal if no root route is defined — this still means the server is responding.

#### 3.2 API Endpoint Testing

Test each API endpoint defined in the server. Common patterns:

```powershell
# Test POST endpoints with sample data
$body = '{"key":"value"}'
(Invoke-WebRequest -Uri http://localhost:<PORT>/api/<endpoint> -Method POST -Body $body -ContentType "application/json" -UseBasicParsing).Content
```

Report pass/fail for each endpoint tested.

#### 3.3 Database Connectivity (if applicable)

If the server uses a database (SQLite, etc.), verify the DB file exists and is accessible:

```powershell
Test-Path -LiteralPath "data.sqlite"
```

### Phase 4: Auto-Fix Common Issues

If any phase fails, attempt these fixes in order:

| Issue | Fix |
|-------|-----|
| Missing `node_modules/` | Run `npm install` |
| Port in use by stale process | Kill the process with `taskkill /PID <PID> /F` |
| Database locked | Delete `<db>.sqlite-wal` and `<db>.sqlite-shm` files (after confirming no active writes) |
| EADDRINUSE | Try next port (PORT+1) and suggest updating server config |
| Module not found | Run `npm install <missing-module>` |
| Syntax error in server.js | Read the error, identify the line, and suggest a fix |

After each auto-fix, restart the server and re-run health checks.

### Phase 5: Report

Provide a summary:

```
Server Status: RUNNING
URL: http://localhost:<PORT>
PID: <pid>
Dependencies: OK
Port: <port>
Health: <pass/fail>
Auto-fixes Applied: <list or "None">
Errors: <any remaining issues or "None">
```

## Error Handling

- Always show the actual error message from logs, not a generic "something went wrong".
- If auto-fix fails, show the user the full error and suggest manual investigation.
- Never kill processes without explaining why.
- When suggesting port changes, remind the user to update `form-exporter.js` or any hardcoded URLs.

## Platform Notes

This skill targets **Windows (PowerShell)**. Commands use PowerShell syntax (`Invoke-WebRequest`, `netstat`, `taskkill`).
For Linux/macOS adaptation, replace:
- `netstat -ano | findstr :PORT` → `lsof -i :PORT` or `ss -tlnp | grep PORT`
- `taskkill /PID X /F` → `kill -9 X`
- `Invoke-WebRequest` → `curl`
- `Start-Process` → `nohup node server.js &`
