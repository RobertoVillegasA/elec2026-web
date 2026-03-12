# ============================================
# Configuración para Despliegue Genérico (VPS/Dedicated)
# ============================================
# Este archivo contiene configuraciones para servidores tradicionales
# ============================================

# ============================================
# SYSTEMD SERVICE (/etc/systemd/system/elec2026.service)
# ============================================
"""
[Unit]
Description=Sistema Electoral Bolivia 2026
After=network.target mysql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/elec2026-web
Environment="PATH=/var/www/elec2026-web/venv/bin"
ExecStart=/var/www/elec2026-web/venv/bin/gunicorn web:app --workers 4 --threads 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --keep-alive 5
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=elec2026

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
"""

# ============================================
# NGINX CONFIG (/etc/nginx/sites-available/elec2026)
# ============================================
"""
# HTTP Server (redirect to HTTPS)
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (optional)
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/elec2026-access.log;
    error_log /var/log/nginx/elec2026-error.log;

    # Client body size limit (for image uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }

    # Health check endpoint (no logging)
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static files (if serving frontend from same server)
    location /static {
        alias /var/www/elec2026-web/backend/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
"""

# ============================================
# MYSQL CONFIGURATION (/etc/mysql/mysql.conf.d/elec2026.cnf)
# ============================================
"""
[mysqld]
# Basic Settings
bind-address = 127.0.0.1
port = 3306

# Performance
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connections
max_connections = 100
max_allowed_packet = 16M

# Query cache (MySQL 5.7)
query_cache_type = 1
query_cache_size = 32M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
"""

# ============================================
# FIREWALL CONFIGURATION (UFW)
# ============================================
"""
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Deny MySQL from external access
sudo ufw deny 3306/tcp

# Enable firewall
sudo ufw enable
"""

# ============================================
# DEPLOYMENT SCRIPT (deploy.sh)
# ============================================
"""
#!/bin/bash

# ============================================
# Script de Despliegue para VPS
# ============================================

set -e

# Configuration
APP_NAME="elec2026"
APP_DIR="/var/www/elec2026-web"
VENV_DIR="$APP_DIR/venv"
USER="www-data"

echo "🚀 Iniciando despliegue de $APP_NAME..."

# Update system
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "📦 Instalando dependencias..."
sudo apt install -y python3 python3-pip python3-venv mysql-server nginx git curl

# Create virtual environment
echo "🐍 Creando entorno virtual..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if not exists
if [ ! -f .env ]; then
    echo "⚙️ Creando archivo .env..."
    cp .env.example .env
    echo "⚠️  EDITA .env CON TUS CREDENCIALES!"
fi

# Run database migrations
echo "🗄️  Ejecutando migraciones..."
# python backend/migrate_to_production.py

# Restart service
echo "🔄 Reiniciando servicio..."
sudo systemctl daemon-reload
sudo systemctl restart $APP_NAME
sudo systemctl status $APP_NAME

# Reload Nginx
echo "🔄 Recargando Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ ¡Despliegue completado!"
echo "📊 URL: https://tu-dominio.com"
echo "📊 API Docs: https://tu-dominio.com/docs"
"""

# ============================================
# DOCKER COMPOSE (docker-compose.yml)
# ============================================
"""
version: '3.8'

services:
  app:
    build: .
    container_name: elec2026-app
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=sistema_electoral
      - DB_USER=electoral
      - DB_PASSWORD=${DB_PASSWORD:-changeme}
      - SECRET_KEY=${SECRET_KEY:-changeme}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:5173}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/static:/app/backend/static
    networks:
      - elec2026-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: mysql:8.0
    container_name: elec2026-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: sistema_electoral
      MYSQL_USER: electoral
      MYSQL_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/create_database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    networks:
      - elec2026-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "electoral", "-p${DB_PASSWORD:-changeme}"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: elec2026-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./backend/static:/var/www/static
    depends_on:
      - app
    networks:
      - elec2026-network

volumes:
  mysql_data:

networks:
  elec2026-network:
    driver: bridge
"""

# ============================================
# DOCKERFILE
# ============================================
"""
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    default-libmysqlclient-dev \\
    pkg-config \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Run with gunicorn
CMD ["gunicorn", "web:app", "--workers", "4", "--threads", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
"""
