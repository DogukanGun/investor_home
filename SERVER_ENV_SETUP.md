# Server Environment Setup Guide

## Quick Start

### Step 1: Generate Secret Key

Generate a strong random secret key for JWT:

```bash
openssl rand -hex 32
```

Example output:
```
a3f2b9c8e1d4f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
```

**Copy this value** — you'll need it below.

---

### Step 2: Prepare .env File

On your server, create `.env` file in the investor_home directory:

```bash
cd /path/to/investor_home
nano .env
```

Copy and paste the content below, **replacing the values marked with `>>>>`**:

```env
# Database (no change needed)
INVESTORHOME_DATABASE_URL=sqlite:////app/data/investorhome.db
INVESTORHOME_ENABLE_SCHEDULER=true
INVESTORHOME_SCRAPE_INTERVAL_HOURS=6

# Security - MUST CHANGE
INVESTORHOME_SECRET_KEY=>>>> PASTE YOUR GENERATED SECRET KEY HERE <<<<
INVESTORHOME_CORS_ORIGINS=["https://>>>> YOUR-DOMAIN.COM <<<<"]
INVESTORHOME_ALGORITHM=HS256
INVESTORHOME_ACCESS_TOKEN_EXPIRE_MINUTES=604800

# Email (OPTIONAL - for password reset feature)
# Leave SMTP_HOST empty if you don't need password reset emails
INVESTORHOME_SMTP_HOST=smtp.gmail.com
INVESTORHOME_SMTP_PORT=587
INVESTORHOME_SMTP_USER=>>>> your-email@gmail.com <<<<
INVESTORHOME_SMTP_PASSWORD=>>>> your-app-password <<<<
INVESTORHOME_SMTP_FROM=noreply@>>>> YOUR-DOMAIN.COM <<<<
INVESTORHOME_FRONTEND_URL=https://>>>> YOUR-DOMAIN.COM <<<<

# Scraper (no change needed)
INVESTORHOME_IS24_ENGINE=camoufox
INVESTORHOME_IS24_HEADLESS=true
INVESTORHOME_REQUEST_MIN_DELAY_S=1.5
INVESTORHOME_REQUEST_MAX_DELAY_S=4.0
INVESTORHOME_REQUEST_TIMEOUT_S=30
INVESTORHOME_MAX_RETRIES=3
INVESTORHOME_MAX_PAGES_PER_SEARCH=3
INVESTORHOME_USE_HTML_CACHE=true

# Deal thresholds (no change needed)
INVESTORHOME_GOOD_DEAL_THRESHOLD=0.10
INVESTORHOME_OVERPRICED_THRESHOLD=-0.10
```

---

### Step 3: Save and Start

Save the file (Ctrl+X, then Y, then Enter in nano).

Then start the backend:

```bash
docker compose up -d
```

Verify it's running:

```bash
curl http://localhost:8086/api/health
# Should return: {"status":"ok"}
```

---

## Complete Reference

### Required Values (Must Change)

| Variable | Example | How to Get |
|----------|---------|-----------|
| `INVESTORHOME_SECRET_KEY` | `a3f2b9c8e1d4...` | `openssl rand -hex 32` |
| `INVESTORHOME_CORS_ORIGINS` | `["https://example.com"]` | Your domain name |

### Optional Email Setup (Password Reset)

If you want users to be able to reset passwords via email:

#### Option 1: Gmail (Recommended for testing)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google will generate a 16-character password
4. Use that as `SMTP_PASSWORD`

```env
INVESTORHOME_SMTP_HOST=smtp.gmail.com
INVESTORHOME_SMTP_PORT=587
INVESTORHOME_SMTP_USER=your-email@gmail.com
INVESTORHOME_SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
INVESTORHOME_SMTP_FROM=noreply@yourdomain.com
INVESTORHOME_FRONTEND_URL=https://yourdomain.com
```

#### Option 2: Custom SMTP Server

If you have your own mail server:

```env
INVESTORHOME_SMTP_HOST=mail.yourdomain.com
INVESTORHOME_SMTP_PORT=587
INVESTORHOME_SMTP_USER=admin@yourdomain.com
INVESTORHOME_SMTP_PASSWORD=your-password
INVESTORHOME_SMTP_FROM=noreply@yourdomain.com
INVESTORHOME_FRONTEND_URL=https://yourdomain.com
```

#### Option 3: Disable Email (Leave Empty)

```env
INVESTORHOME_SMTP_HOST=
INVESTORHOME_SMTP_USER=
INVESTORHOME_SMTP_PASSWORD=
```

This will log reset links to console instead of emailing them.

---

## Environment Variables Explained

### Database & Scheduler

```env
# SQLite database file location (no change needed)
INVESTORHOME_DATABASE_URL=sqlite:////app/data/investorhome.db

# Enable background scraping jobs
INVESTORHOME_ENABLE_SCHEDULER=true

# How often to scrape (in hours)
INVESTORHOME_SCRAPE_INTERVAL_HOURS=6
```

### Security

```env
# Secret key for JWT tokens (MUST CHANGE)
# Min 32 characters. Generate with: openssl rand -hex 32
INVESTORHOME_SECRET_KEY=...

# Which frontend domains can access this backend (MUST CHANGE)
# JSON list format: ["https://yourdomain.com", "https://www.yourdomain.com"]
INVESTORHOME_CORS_ORIGINS=["https://yourdomain.com"]

# JWT algorithm (no change needed)
INVESTORHOME_ALGORITHM=HS256

# How long tokens stay valid (7 days = 604800 minutes)
INVESTORHOME_ACCESS_TOKEN_EXPIRE_MINUTES=604800
```

### ImmoScout24 Scraper

```env
# Engine to use: camoufox (recommended) | playwright | off
INVESTORHOME_IS24_ENGINE=camoufox

# Run in headless mode (no GUI)
INVESTORHOME_IS24_HEADLESS=true

# Optional: Proxy URL for ImmoScout24
# Format: http://user:password@proxy-host:port
# Leave empty for direct connection
# INVESTORHOME_IS24_PROXY=...
```

### Scraper Politeness

```env
# Delay between requests (seconds) to avoid being blocked
INVESTORHOME_REQUEST_MIN_DELAY_S=1.5
INVESTORHOME_REQUEST_MAX_DELAY_S=4.0

# How long to wait for a response
INVESTORHOME_REQUEST_TIMEOUT_S=30

# Retry failed requests
INVESTORHOME_MAX_RETRIES=3

# Max pages to scrape per search
INVESTORHOME_MAX_PAGES_PER_SEARCH=3

# Cache HTML to avoid re-scraping same URLs
INVESTORHOME_USE_HTML_CACHE=true
```

### Deal Rating

```env
# Property is "Good Deal" if it's X% cheaper than area median
# 0.10 = 10% cheaper
INVESTORHOME_GOOD_DEAL_THRESHOLD=0.10

# Property is "Overpriced" if it's X% more expensive than area median
# -0.10 = 10% more expensive
INVESTORHOME_OVERPRICED_THRESHOLD=-0.10
```

### Email / Password Reset

```env
# SMTP server
INVESTORHOME_SMTP_HOST=smtp.gmail.com
INVESTORHOME_SMTP_PORT=587

# Login credentials
INVESTORHOME_SMTP_USER=your-email@gmail.com
INVESTORHOME_SMTP_PASSWORD=your-app-password

# Sender email address
INVESTORHOME_SMTP_FROM=noreply@yourdomain.com

# Frontend URL (used in password reset emails)
INVESTORHOME_FRONTEND_URL=https://yourdomain.com
```

---

## Testing Your Setup

### Test Backend is Running

```bash
curl http://localhost:8086/api/health
# Output: {"status":"ok"}
```

### Test API Docs

Open browser: `http://your-server-ip:8086/docs`

### Test Listings Endpoint

```bash
curl http://localhost:8086/api/listings
# Should return JSON with listings (or empty array if no data yet)
```

### Test Authentication

```bash
# Register
curl -X POST http://localhost:8086/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Login
curl -X POST http://localhost:8086/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

---

## Common Issues

### "CORS error" from frontend

Update `INVESTORHOME_CORS_ORIGINS` to include your frontend domain:

```env
INVESTORHOME_CORS_ORIGINS=["https://yourdomain.com"]
```

Then restart:

```bash
docker compose restart backend
```

### "Invalid token" errors

Make sure `INVESTORHOME_SECRET_KEY` is set and hasn't changed. If you change it, all existing tokens become invalid.

### Password reset emails not sending

1. Check `INVESTORHOME_SMTP_HOST` is not empty
2. Check logs: `docker compose logs -f backend`
3. For Gmail: verify you used app-specific password, not account password

### Scraper running slowly

Increase `INVESTORHOME_REQUEST_MAX_DELAY_S` to avoid being rate-limited:

```env
INVESTORHOME_REQUEST_MIN_DELAY_S=2.0
INVESTORHOME_REQUEST_MAX_DELAY_S=6.0
```

Then restart:

```bash
docker compose restart backend
```

---

## Security Checklist

Before going live:

- [ ] Changed `INVESTORHOME_SECRET_KEY` to a random value
- [ ] Set `INVESTORHOME_CORS_ORIGINS` to your actual domain
- [ ] If using email: configured SMTP credentials
- [ ] Database backup before first run
- [ ] SSL/TLS certificate in reverse proxy (nginx/Apache)
- [ ] Firewall rules to allow only needed ports
- [ ] Regular database backups scheduled
