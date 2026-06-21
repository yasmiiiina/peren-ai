# Checklist production — PEREN AI (OVH)

## Validé dans le dépôt (juin 2026)

- [x] `npm run build` frontend — OK
- [x] Code-splitting Plotly + pages lourdes (lazy loading)
- [x] JWT en cookie httpOnly (`peren_session`) — plus de localStorage
- [x] Abonnements Premium unifiés (`PremiumSubscription` + `premiumPlans.js`)
- [x] Google OAuth corrigé (state CSRF, erreurs redirect, logs)
- [x] Payzone : `/api/payments/initialize` + redirect hosted + callback HMAC
- [x] Proxy Vite `/api` + `/auth` pour dev local (cookies same-origin)
- [x] `docker-compose.yml` — PostgreSQL + backend + frontend
- [x] `psycopg2-binary` dans `requirements.txt` (connexion Postgres Docker)
- [x] `create_all()` désactivé quand `APP_ENV=production` (Alembic seul)
- [x] Mock Google OAuth désactivé en production
- [x] Webhook paiement protégé par `PAYMENT_WEBHOOK_SECRET` en production
- [x] Healthcheck `/healthz` + `/api/healthz` avec test DB
- [x] Proxy Nginx `/api/` et `/auth/` (préfixe préservé)
- [x] `.env.production.example` — template complet
- [x] Scripts `setup-server.sh`, `deploy.sh`, `backup-db.sh`
- [x] Nginx hôte SSL (`deploy/nginx/perenai.conf`)
- [x] Migrations Alembic (schema initial + profile_type/picture_url)

## Limitations MVP connues (non bloquantes pour déploiement)

- [ ] Bundle Plotly encore lourd (~4,7 Mo) — chargé à la demande uniquement
- [ ] Payzone : valider signature/callback avec vos credentials marchands réels

---

## À réaliser sur OVH (obligatoire)

### 1. Infrastructure

- [ ] Commander VPS OVH **VPS-1** (4 vCPU, 8 Go RAM) — ~5–8 €/mois
- [ ] Commander domaine `.ma` (ex. `perenai.ma`)
- [ ] DNS : enregistrement **A** `@` → IP du VPS
- [ ] DNS : enregistrement **A** `www` → IP du VPS

### 2. Serveur

- [ ] Connexion SSH : `ssh ubuntu@VOTRE_IP`
- [ ] Exécuter `sudo bash deploy/scripts/setup-server.sh` (Docker, UFW, Nginx, Certbot)
- [ ] Cloner le projet : `git clone ... /opt/perenai` (ou upload SCP)
- [ ] `cd /opt/perenai && cp .env.production.example .env`
- [ ] Remplir `.env` (voir section ci-dessous)
- [ ] `chmod 600 .env`
- [ ] `docker compose up -d --build`
- [ ] Vérifier : `docker compose ps` (3 services healthy)
- [ ] Vérifier : `curl -s http://127.0.0.1:8080/api/healthz`

### 3. SSL / Nginx hôte

- [ ] Adapter le domaine dans `deploy/nginx/perenai.conf`
- [ ] `sudo cp deploy/nginx/perenai.conf /etc/nginx/sites-available/perenai.conf`
- [ ] `sudo ln -sf .../sites-enabled/`
- [ ] `sudo certbot certonly --webroot -w /var/www/certbot -d DOMAINE -d www.DOMAINE`
- [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] `sudo certbot renew --dry-run`

### 4. Intégrations externes

- [ ] **Google OAuth** : redirect URI `https://DOMAINE/api/auth/google/callback`
- [ ] **Google OAuth** : JS origin `https://DOMAINE`
- [ ] **PayPal** (optionnel) : clés live + plans dans `.env`
- [ ] **Payzone** : renseigner `PAYZONE_MERCHANT_ID` + `PAYZONE_SECRET_KEY`, callback `https://DOMAINE/api/payments/callback`

### 5. Sauvegardes

- [ ] `chmod +x deploy/scripts/backup-db.sh`
- [ ] Cron : `0 3 * * * /opt/perenai/deploy/scripts/backup-db.sh`
- [ ] (Optionnel) Snapshot VPS OVH hebdomadaire

### 6. Tests manuels post-déploiement

- [ ] `https://DOMAINE` — landing page
- [ ] Inscription email / mot de passe
- [ ] Connexion Google OAuth
- [ ] Onboarding complet
- [ ] Score Dashboard (Anatomical System Scanners + historique twin)
- [ ] Scan facial (HTTPS requis pour caméra)
- [ ] Paiement sandbox (carte test)
- [ ] Logs sans erreur : `docker compose logs backend --tail=50`

### 7. Légal (données santé)

- [ ] Politique de confidentialité
- [ ] Mentions légales
- [ ] Consentement données biométriques

---

## Variables `.env` à remplir impérativement

```bash
# Générer les secrets
openssl rand -hex 32   # SECRET_KEY
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # PAYMENT_WEBHOOK_SECRET
```

| Variable | Exemple |
|----------|---------|
| `POSTGRES_PASSWORD` | (32+ caractères aléatoires) |
| `SECRET_KEY` | (32+ caractères aléatoires) |
| `PAYMENT_WEBHOOK_SECRET` | (32+ caractères aléatoires) |
| `FRONTEND_ORIGIN` | `https://perenai.ma` |
| `GOOGLE_CALLBACK_URL` | `https://perenai.ma/api/auth/google/callback` |
| `GOOGLE_CLIENT_ID` | (Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | (Google Cloud Console) |
| `VITE_GOOGLE_CLIENT_ID` | (même que GOOGLE_CLIENT_ID) |

---

## Commandes rapides

```bash
cd /opt/perenai
docker compose up -d --build
docker compose ps
docker compose logs -f backend
curl -s http://127.0.0.1:8080/api/healthz
./deploy/scripts/deploy.sh          # mise à jour
./deploy/scripts/backup-db.sh       # backup manuel
```

## Restauration base de données

```bash
gunzip -c /var/backups/perenai/perenai_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U perenai perenai
```
