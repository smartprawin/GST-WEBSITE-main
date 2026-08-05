---
name: cloudflare-setup
description: >
  Use this skill when the user wants to set up, start, or manage a Cloudflare tunnel for their local server.
  Trigger on phrases like "start tunnel", "cloudflare setup", "expose localhost", "tunnel URL",
  "ngrok alternative", "public URL for local server", or any task involving creating a quick tunnel
  to expose a local development server to the internet via Cloudflare.
---

# Cloudflare Tunnel Setup

A skill for quickly exposing local servers to the internet using Cloudflare Quick Tunnels.

## Prerequisites

- `cloudflared.exe` must be in the project root or system PATH
- Server must be running on the target port (default: 4000)

## Workflow

When invoked, follow these steps in order:

### Phase 1: Pre-flight Checks

#### 1.1 Verify Server is Running

```powershell
netstat -ano | findstr :<PORT>
```

- If port is free: inform user to start the server first, then stop.
- If a process is listening: note the PID and proceed.

#### 1.2 Verify HTTP Connectivity

```powershell
(Invoke-WebRequest -Uri http://localhost:<PORT>/ -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode
```

- If no response: server may not be ready. Wait 3 seconds and retry once.
- If response received: proceed.

#### 1.3 Check cloudflared Binary

```powershell
Test-Path -LiteralPath "cloudflared.exe"
```

- If not found: check system PATH or inform user to download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- If found: proceed.

### Phase 2: Start Tunnel

#### 2.1 Launch Cloudflare Quick Tunnel

```powershell
Start-Process -NoNewWindow -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:<PORT>" -WorkingDirectory "<project_root>" -RedirectStandardOutput "tunnel.log" -RedirectStandardError "tunnel.err.log"
```

#### 2.2 Wait and Extract URL

```powershell
Start-Sleep -Seconds 5
Select-String -Path "tunnel.err.log" -Pattern "trycloudflare.com"
```

- If URL found: extract and display it.
- If no URL after 10 seconds: check logs for errors.

### Phase 3: Report

Provide a summary:

```
Tunnel Status: ACTIVE
URL: https://<random-name>.trycloudflare.com
Local Server: http://localhost:<PORT>
Protocol: QUIC
Note: This is a temporary URL. It will expire when the tunnel process stops.
```

## Common Errors

| Error | Solution |
|-------|----------|
| `cloudflared.exe not found` | Download from Cloudflare website or add to PATH |
| `ECONNREFUSED` | Start the server first |
| `DNS resolution error` | Check internet connection |
| `Port already in use` | Kill stale process or use different port |

## Platform Notes

This skill targets **Windows (PowerShell)**. For Linux/macOS:
- Replace `netstat -ano | findstr :PORT` → `lsof -i :PORT`
- Replace `taskkill /PID X /F` → `kill -9 X`
- Replace `Start-Process` → `nohup cloudflared tunnel --url http://localhost:PORT &`
