# Deployment & Hosting Guide - GST Website

## Current Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| Database | SQLite (data.sqlite) |
| Port | 4000 |

---

## Hosting Options Comparison

| Hosting | Cost | Difficulty | Best For |
|---------|------|------------|----------|
| **Vercel** | Free tier | Easy | Static sites, serverless |
| **Netlify** | Free tier | Easy | Static sites |
| **Railway** | Free tier | Easy | Node.js apps |
| **Render** | Free tier | Easy | Node.js apps |
| **DigitalOcean** | $5/month | Medium | Full control |
| **AWS EC2** | Pay as you go | Hard | Enterprise |
| **Shared Hosting** | $3-10/month | Medium | Traditional hosting |
| **VPS (Hostinger)** | $5-10/month | Medium | Budget option |

---

## Option 1: Railway (Recommended for Node.js)

### Why Railway?
- Free tier available
- Built-in SQLite support
- Easy deployment
- Automatic SSL

### Steps:
1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Push Code to GitHub**
   ```bash
   cd "F:\Data Engineering\GST-WEBSITE-main"
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/gst-website.git
   git push -u origin main
   ```

3. **Deploy on Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js

4. **Set Environment Variables**
   ```
   PORT=4000
   DB_PATH=./data/data.sqlite
   ```

5. **Get Live URL**
   - Railway provides: `https://your-app.up.railway.app`

---

## Option 2: Render (Free Tier)

### Steps:
1. **Create Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect GitHub repo

3. **Configure**
   ```
   Name: gst-website
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment**
   ```
   PORT=4000
   DB_PATH=./data/data.sqlite
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Get URL: `https://gst-website.onrender.com`

---

## Option 3: Vercel (Static + Serverless)

### Steps:
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd "F:\Data Engineering\GST-WEBSITE-main"
   vercel
   ```

4. **Follow Prompts**
   - Set up and deploy? Y
   - Which scope? (select your account)
   - Link to existing project? N
   - Project name? gst-website
   - Directory where code is located? ./

5. **Get URL**
   - `https://gst-website.vercel.app`

**Note:** Vercel doesn't support SQLite well. Use Vercel + external database.

---

## Option 4: Netlify (Static Only)

### Steps:
1. **Go to** https://netlify.com
2. **Drag and drop** your `public` folder
3. **Get URL** instantly

**Note:** Backend won't work on Netlify. Need separate API hosting.

---

## Option 5: Traditional VPS Hosting

### Providers:
- Hostinger ($5/month)
- DigitalOcean ($5/month)
- Linode ($5/month)
- Vultr ($5/month)

### Steps (Hostinger Example):

1. **Buy VPS Plan**
   - Select Ubuntu 22.04
   - Get SSH access details

2. **Connect via SSH**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Upload Code**
   ```bash
   # On your local machine
   scp -r "F:\Data Engineering\GST-WEBSITE-main" root@YOUR_IP:/var/www/gst-website
   ```

5. **Install Dependencies**
   ```bash
   cd /var/www/gst-website
   npm install
   ```

6. **Run with PM2 (keeps app running)**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name gst-website
   pm2 startup
   pm2 save
   ```

7. **Setup Domain & SSL**
   - Point domain to server IP
   - Install Certbot for SSL:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Option 6: Docker Deployment

### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
```

### docker-compose.yml:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "4000:4000"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=4000
      - DB_PATH=./data/data.sqlite
    restart: always
```

### Commands:
```bash
docker-compose up -d
docker-compose logs -f
```

---

## Pre-Deployment Checklist

### Code Changes Needed:

1. **Update Server for Production**
   ```javascript
   // src/server.js
   const PORT = process.env.PORT || 4000;
   ```

2. **Add CORS for Production**
   ```javascript
   app.use(cors({
       origin: process.env.ALLOWED_ORIGIN || '*'
   }));
   ```

3. **Static Files Path**
   ```javascript
   app.use(express.static('public'));
   ```

4. **Database Path**
   ```javascript
   const dbPath = process.env.DB_PATH || './data/data.sqlite';
   ```

### Files to Update:

| File | Change |
|------|--------|
| `src/server.js` | Use env vars for PORT, DB_PATH |
| `.env` | Add production values |
| `package.json` | Ensure `start` script works |

---

## Environment Variables

Create `.env` file:
```
PORT=4000
DB_PATH=./data/data.sqlite
NODE_ENV=production
ALLOWED_ORIGIN=https://yourdomain.com
```

---

## Domain Setup

### Buy Domain:
- Namecheap ($8-12/year)
- GoDaddy ($10-15/year)
- Google Domains ($12/year)
- Cloudflare Registrar ($8-10/year)

### DNS Configuration:
```
Type    Name    Value
A       @       YOUR_SERVER_IP
CNAME   www     your-app.herokuapp.com
```

---

## SSL Certificate (Free)

### Options:
1. **Let's Encrypt** (free)
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

2. **Cloudflare** (free)
   - Add domain to Cloudflare
   - Enable SSL

3. **Hosting Provider**
   - Most provide free SSL

---

## Recommended Setup (Budget)

| Component | Choice | Cost |
|-----------|--------|------|
| Hosting | Railway/Render | Free |
| Domain | Cloudflare | $8/year |
| SSL | Cloudflare | Free |
| Database | SQLite (local) | Free |
| **Total** | | **~$8/year** |

---

## Recommended Setup (Professional)

| Component | Choice | Cost |
|-----------|--------|------|
| Hosting | DigitalOcean VPS | $5/month |
| Domain | Namecheap | $10/year |
| SSL | Let's Encrypt | Free |
| Database | SQLite/PostgreSQL | Free |
| CDN | Cloudflare | Free |
| **Total** | | **~$70/year** |

---

## Quick Deploy Commands

### Railway:
```bash
git push origin main
# Auto-deploys
```

### Render:
```bash
git push origin main
# Auto-deploys
```

### VPS:
```bash
ssh root@YOUR_IP
cd /var/www/gst-website
git pull
npm install
pm2 restart gst-website
```

---

## Monitoring & Logs

### Railway:
```bash
railway logs
```

### Render:
- Dashboard → Logs tab

### VPS with PM2:
```bash
pm2 logs gst-website
pm2 monit
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App crashes | Check logs: `pm2 logs` |
| Database error | Ensure `data/` folder exists |
| Port in use | Change PORT in .env |
| SSL error | Re-run certbot |
| 502 Error | Check if app is running |

---

## Step-by-Step: Deploy to Railway Now

```bash
# 1. Install Git (if not installed)
# Download from https://git-scm.com

# 2. Initialize Git in your project
cd "F:\Data Engineering\GST-WEBSITE-main"
git init

# 3. Create .gitignore
echo "node_modules/" > .gitignore
echo "data/*.sqlite" >> .gitignore
echo ".env" >> .gitignore

# 4. Add all files
git add .

# 5. Commit
git commit -m "Initial commit"

# 6. Create GitHub repo and push
# Go to https://github.com/new
# Create repo named: gst-website
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/gst-website.git
git push -u origin main

# 7. Deploy on Railway
# Go to https://railway.app
# Sign up with GitHub
# Click "New Project" → "Deploy from GitHub"
# Select your repo
# Done! Get your live URL
```

---

## Current Status

| Item | Status |
|------|--------|
| Code Ready | Yes |
| Server.js | Configured |
| Database | SQLite ready |
| Frontend | Complete |
| Deployment | Not yet done |

---

## Next Steps

1. Create GitHub account (if needed)
2. Push code to GitHub
3. Choose hosting platform (Railway recommended)
4. Deploy and get live URL
5. Setup custom domain (optional)

---

## Need Help?

Tell me which hosting option you prefer and I can guide you through the exact steps!
