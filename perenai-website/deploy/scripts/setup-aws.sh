#!/usr/bin/env bash
# Initial AWS EC2 setup (Ubuntu 24.04) — run once
# Usage: sudo bash deploy/scripts/setup-aws.sh
set -euo pipefail

echo "==> System update"
apt update && apt upgrade -y

echo "==> Base packages"
apt install -y git curl ufw fail2ban nginx certbot python3-certbot-nginx

echo "==> Docker"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker ubuntu || true
fi

echo "==> Docker Compose plugin"
apt install -y docker-compose-plugin

echo "==> Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Directories"
mkdir -p ~/peren /var/www/certbot /var/backups/perenai
chmod +x deploy/scripts/*.sh 2>/dev/null || true

echo "==> Done. Next steps:"
echo "  1. git clone URL_DU_REPO ~/peren && cd ~/peren"
echo "  2. cp .env.production.example .env && nano .env"
echo "  3. docker compose up -d --build"
echo "  4. sudo cp deploy/nginx/peren.ai.conf /etc/nginx/sites-available/"
echo "  5. sudo certbot --nginx -d peren.ai -d www.peren.ai"
echo "  See DEPLOYMENT_AWS.md for full guide."
