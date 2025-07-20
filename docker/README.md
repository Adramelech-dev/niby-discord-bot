# Docker Setup for Niby

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)
- A `.env` file in the project root (copy from `.env-EXAMPLE`)

### 1. Prepare Environment

```bash
# Navigate to project root
cd /path/to/niby-discord-bot

# Copy and configure environment file
cp .env-EXAMPLE .env
# Edit .env with your configuration (BOT_TOKEN, DATABASE_URL, etc.)
```

### 2. Build and Run

```bash
# Navigate to docker directory
cd docker/images/niby

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f niby-bot
```

### 3. Stop Services

```bash
docker-compose down

# To also remove volumes (WARNING: This will delete Redis data and logs)
docker-compose down -v
```

## 🔧 Configuration

### Environment Variables

The Docker setup supports all environment variables from `.env-EXAMPLE`. Key variables include:

#### Required Variables
- `BOT_TOKEN` - Discord bot token
- `DATABASE_URL` - MongoDB connection string
- `LANGUAGE` - Default bot language

#### Optional Variables (with Docker defaults)
- `REDIS_PASSWORD` - Redis password (empty by default)
- `DASHBOARD_PORT` - External port for dashboard (3000 by default)

### Docker-specific Configuration

The compose file sets these Docker-optimized defaults:

```yaml
environment:
  - REDIS_URL=redis:6379        # Points to Redis container
  - CACHE_DB=true               # Enable Redis caching
  - PORT=3000                   # Internal container port
  - DASHBOARD=true              # Enable web dashboard
  - WEB_DOMAIN=localhost        # Dashboard domain
  - NODE_ENV=production         # Production mode
```

##  Services

### 1. Redis (`niby-redis`)
- **Image**: `redis:7-alpine`
- **Purpose**: Caching and session storage
- **Ports**: `6379:6379`
- **Features**:
  - Data persistence with AOF
  - Health checks
  - Optional password protection

### 2. Niby Bot (`niby-discord-bot`)
- **Image**: Built from `Dockerfile`
- **Purpose**: Main Discord bot application
- **Ports**: `3000:3000` (configurable via `DASHBOARD_PORT`)
- **Features**:
  - Multi-stage build for optimized image size
  - Health checks
  - Log persistence
  - Security hardening

## Monitoring & Health

### Health Checks

Both services include health checks:

- **Redis**: `redis-cli ping`
- **Bot**: HTTP check on `/health` endpoint

### Viewing Status

```bash
# Check service status
docker-compose ps

# View service health
docker-compose exec niby-bot curl http://localhost:3000/health

# Monitor logs
docker-compose logs -f
```

## Data Persistence

### Volumes

- `redis_data` - Redis database files
- `niby_logs` - Bot application logs

### Backup

```bash
# Backup Redis data
docker run --rm -v niby_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Backup logs
docker run --rm -v niby_niby_logs:/logs -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz -C /logs .
```

##  Development

### Building

```bash
# Build without cache
docker-compose build --no-cache

# Build with specific target
docker-compose build --build-arg NODE_ENV=development niby-bot
```

### Debugging

```bash
# Access bot container shell
docker-compose exec niby-bot sh

# View container resources
docker stats

# Inspect container configuration
docker inspect niby-discord-bot
```

## Updates

### Updating the Bot

```bash
# Pull latest code and rebuild
git pull origin main
docker-compose build niby-bot
docker-compose up -d

# Alternative: recreate containers
docker-compose up -d --force-recreate
```

### Updating Redis

```bash
# Update Redis image
docker-compose pull redis
docker-compose up -d redis
```
