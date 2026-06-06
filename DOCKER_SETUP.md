# Docker Setup Guide

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Git installed
- 4GB+ free disk space

### 2. Clone and Setup

```bash
git clone https://github.com/DogukanGun/investor_home.git
cd investor_home
```

### 3. Configure Environment (Optional)

For development, the default `.env` file is already configured. For production, copy and customize:

```bash
cp .env.example .env
# Edit .env with your production settings:
# - INVESTORHOME_SECRET_KEY (use a strong random string)
# - INVESTORHOME_CORS_ORIGINS (set to your domain)
# - INVESTORHOME_SMTP_* (if using password reset feature)
# - INVESTORHOME_IS24_PROXY (if behind a proxy)
```

### 4. Start All Services

```bash
docker compose up -d
```

This will:
- Build the backend image (first time only)
- Build the frontend image (first time only)
- Start backend service on port 8000
- Start frontend service on port 8080
- Create `./data` directory with persistent database

### 5. Verify Services

```bash
docker compose ps
```

Expected output:
```
NAME                      STATUS          PORTS
investorhome-backend      Up              0.0.0.0:8000->8000/tcp
investorhome-frontend     Up              0.0.0.0:8080->80/tcp
```

### 6. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/health |

---

## Database Persistence

### How It Works

The database is stored in `./data/investorhome.db` on your host machine. This is a **bind mount**, not a Docker volume, which means:

✅ **Survives** container restarts  
✅ **Survives** image rebuilds  
✅ **Survives** `docker compose down`  
✅ **Survives** releases and redeployments  
✅ **Easy backup** — just copy the file  

### Database File Locations

- **Database:** `./data/investorhome.db` (~ 0.5 MB typical)
- **Scrape cache:** `./data/cache/` (HTML files cached during scraping)

### Backup Database

Before updating or testing destructive changes:

```bash
cp ./data/investorhome.db ./data/investorhome.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Restore from Backup

```bash
cp ./data/investorhome.db.backup.20260606_120000 ./data/investorhome.db
docker compose restart backend
```

### Reset Database

To delete all data and start fresh:

```bash
docker compose down
rm ./data/investorhome.db
docker compose up -d
```

---

## Common Commands

### View Logs

```bash
# Backend logs (live)
docker compose logs -f backend

# Frontend logs (live)
docker compose logs -f frontend

# All services (last 50 lines)
docker compose logs --tail=50

# All services (live)
docker compose logs -f
```

### Restart Services

```bash
# Restart backend only
docker compose restart backend

# Restart frontend only
docker compose restart frontend

# Restart all services
docker compose restart
```

### Stop Services

```bash
# Stop but keep containers
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove everything (including data)
docker compose down -v
```

### Rebuild Images

```bash
# Rebuild and restart
docker compose up --build -d

# Rebuild without cache
docker compose up --build --no-cache -d
```

### Execute Commands in Container

```bash
# Run Python code in backend
docker compose exec backend python -c "print('Hello')"

# Open shell in backend
docker compose exec backend /bin/bash

# Run pytest in backend
docker compose exec backend pytest
```

---

## Troubleshooting

### Ports Already in Use

If port 8000 or 8080 is already in use:

**Edit `docker-compose.yml`:**

```yaml
backend:
  ports:
    - "8001:8000"  # Change first number to available port

frontend:
  ports:
    - "8081:80"    # Change first number to available port
```

Then restart:
```bash
docker compose up -d
```

### Container Won't Start

Check the logs:

```bash
docker compose logs backend
docker compose logs frontend
```

Common issues:
- Port already in use → change port mapping
- Insufficient disk space → free up space
- Permission denied → use `sudo` or check docker daemon

### Database Locked Error

SQLite occasionally locks if accessed concurrently:

```bash
docker compose restart backend
```

### Frontend Can't Connect to Backend

Verify the backend is healthy:

```bash
curl http://localhost:8000/api/health
```

Should return: `{"status":"ok"}`

If not, check backend logs:

```bash
docker compose logs backend
```

### Rebuild Everything from Scratch

```bash
docker compose down -v
rm -rf ./data/*.db
docker compose up --build -d
```

---

## Production Deployment

### Before Going Live

1. **Update `.env` with production settings:**

```bash
# Security
INVESTORHOME_SECRET_KEY=<generate-strong-random-key>
INVESTORHOME_CORS_ORIGINS=["https://yourdomain.com"]

# Email
INVESTORHOME_SMTP_HOST=smtp.gmail.com
INVESTORHOME_SMTP_PORT=587
INVESTORHOME_SMTP_USER=your-email@gmail.com
INVESTORHOME_SMTP_PASSWORD=your-app-password
INVESTORHOME_FRONTEND_URL=https://yourdomain.com

# Proxy (if needed)
INVESTORHOME_IS24_PROXY=http://user:pass@proxy-host:8080
```

2. **Backup database daily:**

```bash
# Add to crontab (runs at 2 AM daily)
0 2 * * * cp /path/to/investor_home/data/investorhome.db /path/to/backups/investorhome.db.$(date +\%Y\%m\%d)
```

3. **Use reverse proxy (nginx/Apache):**

Point your domain to `http://localhost:8000` (backend) and `http://localhost:8080` (frontend).

Example nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8000;
    }
}
```

4. **Enable SSL/TLS:**

Use Let's Encrypt (certbot) to get free HTTPS certificates.

5. **Monitor health:**

```bash
# Add to crontab (check every 5 minutes)
*/5 * * * * curl -f http://localhost:8000/api/health || echo "Backend down at $(date)" | mail -s "InvestorHome Alert" admin@example.com
```

---

## Docker Compose Files Reference

The following services are configured:

### Backend Service

| Setting | Value |
|---------|-------|
| Container Name | `investorhome-backend` |
| Build Context | `./backend` |
| Port | `8000` (host) → `8000` (container) |
| Restart | Unless stopped |
| Health Check | `/api/health` endpoint (30s interval) |
| Volume | `./data` (host) → `/app/data` (container) |
| Network | `investorhome-network` |

### Frontend Service

| Setting | Value |
|---------|-------|
| Container Name | `investorhome-frontend` |
| Build Context | `./frontend` |
| Port | `8080` (host) → `80` (container) |
| Restart | Unless stopped |
| Depends On | Backend (waits for health check) |
| Network | `investorhome-network` |

### Network

- **Driver:** bridge
- **Name:** `investorhome-network`
- **Purpose:** Internal service communication

---

## Environment Variables

See `.env.example` for all available variables and their defaults. Key variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `INVESTORHOME_DATABASE_URL` | SQLite connection string | `sqlite:////app/data/investorhome.db` |
| `INVESTORHOME_ENABLE_SCHEDULER` | Enable background jobs | `true` |
| `INVESTORHOME_SCRAPE_INTERVAL_HOURS` | Scraper frequency | `6` |
| `INVESTORHOME_IS24_ENGINE` | ImmoScout24 scraper | `camoufox` |
| `INVESTORHOME_SECRET_KEY` | JWT secret key | `change-me-in-production-with-strong-key` |
| `INVESTORHOME_CORS_ORIGINS` | CORS whitelist | `["http://localhost:8080"]` |
| `VITE_API_URL` | Frontend API URL | `http://localhost:8000` |

---

## Support

For issues or questions:

1. Check the logs: `docker compose logs -f`
2. Review this guide
3. Check the GitHub issues: https://github.com/DogukanGun/investor_home/issues
4. Create a new issue with error details
