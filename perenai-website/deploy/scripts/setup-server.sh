#!/usr/bin/env bash
# Initial OVH VPS setup — run once as root or with sudo
# Usage: curl -fsSL ... | bash   OR   sudo bash deploy/scripts/setup-server.sh
set -euo pipefail

echo "==> System update"
apt update && apt upgrade -y

echo "==> Base packages"
apt install -y git curl ufw fail2ban nginx certbot python3-certbot-nginx

echo "==> Docker"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Directories"
mkdir -p /opt/perenai /var/www/certbot /var/backups/perenai

echo "==> Done. Next steps:"
echo "  1. Clone project to /opt/perenai"
echo "  2. cp .env.production.example .env && nano .env"
echo "  3. docker compose up -d --build"
echo "  4. Configure Nginx + certbot (see DEPLOYMENT_OVH.md)"
