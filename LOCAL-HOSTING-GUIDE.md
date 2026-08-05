# Local Hosting Guide - GST Website

Host your website from your local computer and share it with anyone in the world.

---

## Why Host Locally?

| Benefit | Description |
|---------|-------------|
| Free | No hosting costs |
| Full Control | Your machine, your data |
| Quick Testing | Instant changes |
| Development | Perfect for demos |

---

## Option 1: ngrok (Recommended)

### What is ngrok?
Creates a secure tunnel from your local server to the internet.

### Step 1: Install ngrok

1. Go to **https://ngrok.com**
2. Click **"Sign up"** (free account)
3. Verify your email
4. Go to **"Download"** page
5. Download **Windows (64-bit)**
6. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok`)

### Step 2: Setup Auth Token

1. After login, go to **"Getting Started"** or **"Your Authtoken"**
2. Copy your authtoken
3. Open terminal and run:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### Step 3: Start Your Server

```bash
# Open terminal in project folder
cd "F:\Data Engineering\GST-WEBSITE-main"

# Start the server
npm start
```

You'll see:
```
GST Website running at http://localhost:4000
```

### Step 4: Start ngrok

**Open a NEW terminal window** and run:
```bash
ngrok http 4000
```

You'll see:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:4000
```

### Step 5: Share the URL

Your public URL: **https://abc123.ngrok-free.app**

Anyone can now access your website!

### ngrok Free Plan Limits

| Feature | Limit |
|---------|-------|
| Domains | 1 |
| Connections | 40 concurrent |
| Bandwidth | 1 GB/week |
| Requests | 40/minute |

---

## Option 2: Cloudflare Tunnel

### What is Cloudflare Tunnel?
Free, secure tunnel by Cloudflare. No bandwidth limits.

### Step 1: Install cloudflared

1. Go to **https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/**
2. Download **Windows (64-bit)**
3. Extract to a folder (e.g., `C:\cloudflare`)
4. Add folder to PATH (optional)

### Step 2: Start Your Server

```bash
cd "F:\Data Engineering\GST-WEBSITE-main"
npm start
```

### Step 3: Start Tunnel

**Open NEW terminal:**
```bash
cloudflared tunnel --url http://localhost:4000
```

You'll see:
```
Your quick Tunnel has been created! Visit it at:
https://random-name.trycloudflare.com
```

### Step 4: Share the URL

Your public URL: **https://random-name.trycloudflare.com**

### Cloudflare Tunnel Benefits

| Feature | Benefit |
|---------|---------|
| Free | No cost |
| No signup | Works immediately |
| No limits | Unlimited bandwidth |
| HTTPS | Secure by default |
| Fast | Cloudflare network |

---

## Option 3: localtunnel

### Step 1: Install

```bash
npm install -g localtunnel
```

### Step 2: Start Your Server

```bash
cd "F:\Data Engineering\GST-WEBSITE-main"
npm start
```

### Step 3: Start localtunnel

**Open NEW terminal:**
```bash
lt --port 4000
```

You'll see:
```
your url is: https://abc123.loca.lt
```

### Step 4: Share the URL

**Note:** Visitors may need to click "Click to Continue" button.

---

## Comparison Table

| Feature | ngrok | Cloudflare | localtunnel |
|---------|-------|------------|-------------|
| Cost | Free | Free | Free |
| Signup Required | Yes | No | No |
| Bandwidth | 1 GB/week | Unlimited | Unlimited |
| Speed | Fast | Very Fast | Medium |
| Custom Domain | Paid | Free | No |
| HTTPS | Yes | Yes | Yes |
| Ease of Setup | Easy | Easier | Easiest |

---

## Quick Start Commands

### ngrok:
```bash
# Terminal 1
npm start

# Terminal 2
ngrok http 4000
```

### Cloudflare Tunnel:
```bash
# Terminal 1
npm start

# Terminal 2
cloudflared tunnel --url http://localhost:4000
```

### localtunnel:
```bash
# Terminal 1
npm start

# Terminal 2
lt --port 4000
```

---

## Troubleshooting

### Issue: "Port already in use"
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process
taskkill /PID PROCESS_ID /F
```

### Issue: "Command not found"
```bash
# For ngrok, use full path
C:\ngrok\ngrok.exe http 4000

# Or add to PATH
set PATH=%PATH%;C:\ngrok
```

### Issue: "Connection refused"
- Make sure server is running: `npm start`
- Check server is on port 4000

### Issue: ngrok "Session Expired"
```bash
# Re-run with authtoken
ngrok config add-authtoken YOUR_TOKEN
ngrok http 4000
```

---

## Permanent Setup (Run on Startup)

### Create Batch File:

Create `start-server.bat` in project folder:
```bat
@echo off
cd "F:\Data Engineering\GST-WEBSITE-main"
npm start
```

### Create Tunnel Batch:

Create `start-tunnel.bat`:
```bat
@echo off
ngrok http 4000
```

### Run Both:
1. Double-click `start-server.bat`
2. Double-click `start-tunnel.bat`

---

## Security Notes

| Tip | Why |
|-----|-----|
| Don't share sensitive data | Public URL is accessible to anyone |
| Use ngrok auth token | Prevents others from using your tunnel |
| Close when done | Stops public access |
| Don't expose passwords | Anyone can see your site |

---

## Best for Demos

### Recommended: **Cloudflare Tunnel**

```bash
# Why?
- No signup needed
- No bandwidth limits
- Fast speeds
- Always works
```

---

## Step-by-Step: Deploy Now

### Using Cloudflare Tunnel (Fastest):

```bash
# 1. Start server
cd "F:\Data Engineering\GST-WEBSITE-main"
npm start

# 2. Open NEW terminal, run:
cloudflared tunnel --url http://localhost:4000

# 3. Copy the URL shown
# 4. Share with anyone!
```

---

## Need Help?

Tell me which option you want to try and I'll guide you through it!
