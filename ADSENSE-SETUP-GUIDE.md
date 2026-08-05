# Google AdSense Integration Guide

## Overview
This project integrates Google AdSense across all pages with:
1. **Banner Ads** - Standard display ads in header, footer, and sidebar
2. **Video Ad Popup** - Small popup video ad on page load (300x140px)

---

## What You Need from AdSense

| Item | Description | Where to Find |
|------|-------------|---------------|
| **Publisher ID** | Starts with `ca-pub-` | AdSense Dashboard → Account → Account Information |
| **Ad Slot IDs** | Number like `1234567890` | AdSense Dashboard → Ads → By ad unit → Create ad unit |

### Ad Units to Create in AdSense

Create these ad units in your AdSense dashboard:

| Ad Unit Name | Type | Size | Location |
|--------------|------|------|----------|
| Header Banner | Display | Responsive | Top of page |
| Footer Banner | Display | Responsive | Bottom of page |
| Sidebar | Display | Responsive | Right sidebar |
| Video Ad | Video | 300x250 | Popup overlay |

---

## Files to Update

### 1. Video Ad Popup
**File:** `public/js/video-ad.js`

```javascript
// Line 17-18
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  ← Replace with Publisher ID
data-ad-slot="XXXXXXXXXX"                  ← Replace with Video Ad Slot ID
```

### 2. All HTML Pages (22 files)
**Location:** `public/**/*.html`

Each HTML file has 3 places to update:

#### A. AdSense Script Tag (in `<head>`)
```html
<!-- Line ~8 in each file -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

#### B. Header Ad Slot
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"></ins>
```

#### C. Footer Ad Slot
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"></ins>
```

---

## Complete File List

### Login Pages
| File | Script | Header Ad | Footer Ad |
|------|--------|-----------|-----------|
| `public/login/loginPage.html` | Line 8 | Line ~160 | Line ~270 |

### Registration Pages
| File | Script | Header Ad | Footer Ad |
|------|--------|-----------|-----------|
| `public/register/MAIN.html` | Line 8 | Line ~38 | Line ~150 |
| `public/register/OTP.html` | Line 8 | Line ~237 | Line ~366 |
| `public/register/OTP2.html` | Line 8 | Line ~150 | Line ~260 |
| `public/register/adhar.html` | Line 9 | Line ~167 | Line ~341 |
| `public/register/verify.html` | Line 8 | Line ~160 | Line ~270 |
| `public/register/verification.html` | Line 9 | Line ~197 | Line ~360 |
| `public/register/goods.html` | Line 8 | Line ~136 | Line ~281 |
| `public/register/additionalplaces.html` | Line 8 | Line ~136 | Line ~281 |
| `public/register/state specific.html` | Line 8 | Line ~145 | Line ~302 |
| `public/register/principlepalace.html` | Line 8 | Line ~262 | Line ~540 |
| `public/register/registration-summary.html` | Line 7 | Line ~112 | Line ~125 |

### Dashboard Pages
| File | Script | Header Ad | Footer Ad |
|------|--------|-----------|-----------|
| `public/register/dashboard.html` | Line 8 | Line ~50 | Line ~180 |
| `public/register/dash2.html` | Line 8 | Line ~106 | Line ~200 |
| `public/register/dash3.html` | Line 8 | Line ~70 | Line ~160 |
| `public/register/dash4.html` | Line 8 | Line ~343 | Line ~578 |
| `public/register/dash41.html` | Line 8 | Line ~315 | Line ~540 |
| `public/register/dash5.html` | Line 8 | Line ~416 | Line ~670 |
| `public/register/dash6.html` | Line 8 | Line ~181 | Line ~310 |
| `public/register/dash7.html` | Line 8 | Line ~170 | Line ~314 |

### Welcome Pages
| File | Script | Header Ad | Footer Ad |
|------|--------|-----------|-----------|
| `public/welcome.html` | Line 8 | Line ~50 | Line ~120 |

### Video Ad (All Pages)
| File | Location |
|------|----------|
| `public/js/video-ad.js` | Line 17-18 |

---

## Quick Find & Replace

Use this command to find all placeholder IDs:

```bash
# Windows PowerShell
Get-ChildItem -Path "public" -Recurse -Filter "*.html" | Select-String -Pattern "ca-pub-XXXXXXXXXXXXXXXX"

# Or for all files
Get-ChildItem -Path "public" -Recurse -Include "*.html","*.js" | Select-String -Pattern "ca-pub-XXXXXXXXXXXXXXXX"
```

### Replace Publisher ID
```bash
# In all HTML files
(Get-ChildItem -Path "public" -Recurse -Filter "*.html") | ForEach-Object {
    (Get-Content $_.FullName) -replace 'ca-pub-XXXXXXXXXXXXXXXX', 'ca-pub-YOUR-REAL-ID' | Set-Content $_.FullName
}

# In video-ad.js
(Get-Content "public/js/video-ad.js") -replace 'ca-pub-XXXXXXXXXXXXXXXX', 'ca-pub-YOUR-REAL-ID' | Set-Content "public/js/video-ad.js"
```

### Replace Ad Slot IDs
You'll need to manually replace each `data-ad-slot="XXXXXXXXXX"` with the correct slot ID for each ad unit type (header, footer, video).

---

## AdSense Account Requirements

Before ads show, ensure:

1. **Account Approved** - AdSense account must be approved
2. **Site Added** - Add your domain in AdSense → Sites
3. **DNS Verified** - Verify ownership via DNS record
4. **Privacy Policy** - Required by AdSense (add to your site)
5. **Cookie Consent** - Required for GDPR compliance

---

## Testing Ads

1. Replace placeholder IDs with real IDs
2. Run `npm start`
3. Visit `http://localhost:4000`
4. Ads may take 24-48 hours to start showing after approval

**Note:** AdSense may show blank ads until:
- Account is fully approved
- Site is reviewed
- Ad units are created and active

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No ads showing | Wait 24-48 hours after approval |
| Blank ad spaces | Check if ad unit IDs are correct |
| "adsbygoogle.push() error" | Publisher ID or slot ID is invalid |
| Video popup not showing | Check browser console for errors |

---

## Current Status

| Item | Status |
|------|--------|
| Publisher ID | `ca-pub-5527929723291753` |
| Ad Slot IDs | `XXXXXXXXXX` (placeholder) |
| Files Updated | 23 files (22 HTML + 1 JS) |
| Ad Format | Banner + Video Popup |
| Theme | Dark (#1a1a2e) |
