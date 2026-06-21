# Déploiement PEREN AI sur OVH — Guide complet

Ce document couvre l'analyse technique, l'architecture recommandée, les fichiers générés, les commandes serveur et la checklist de mise en production.

---

## 1. Stack technique

| Couche | Technologie | Version / détail |
|--------|-------------|------------------|
| **Frontend** | React 18 + Vite 3 | SPA, Tailwind CSS, React Router 6 |
| **UI** | lucide-react, framer-motion, Plotly, Recharts | Dashboard digital twin, scans |
| **HTTP client** | Axios | `VITE_API_URL=/api` en production |
| **Backend** | FastAPI + Uvicorn | Python 3.12 |
| **ORM / migrations** | SQLAlchemy 2 + Alembic | `alembic upgrade head` au démarrage |
| **Auth** | JWT (HS256) + Google OAuth 2.0 | Tokens en localStorage |
| **Base de données** | SQLite (dev) / **PostgreSQL 16** (prod) | Via `DATABASE_URL` |
| **Paiements** | Payzone (config), PayPal (optionnel) | Webhooks `/api/payments/*` |
| **Conteneurisation** | Docker + Docker Compose | 3 services : db, backend, frontend |
| **Reverse proxy** | Nginx (conteneur + hôte) | SSL Let's Encrypt sur le VPS |

### Structure du projet

```
perenai-website/
├── frontend/          # React/Vite → image nginx
├── backend/           # FastAPI
├── docker-compose.yml
├── .env.production.example
└── deploy/
    ├── nginx/perenai.conf
    └── scripts/{deploy,backup-db}.sh
```

---

## 2. État de préparation production

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| Build frontend | ✅ | `npm run build` OK |
| Dockerfiles | ✅ | frontend + backend présents |
| docker-compose | ✅ | Généré (PostgreSQL + healthchecks) |
| Migrations Alembic | ✅ | 2 migrations ; `create_all` **désactivé** en production |
| Secrets / .env | ⚠️ | `SECRET_KEY`, `POSTGRES_PASSWORD`, `PAYMENT_WEBHOOK_SECRET` obligatoires |
| Driver PostgreSQL | ✅ | `psycopg2-binary` ajouté à requirements.txt |
| Mock auth/paiement | ✅ | Désactivé / protégé quand `APP_ENV=production` |
| Proxy API | ✅ corrigé | `nginx.conf` préserve le préfixe `/api` |
| SQLite en prod | ❌ | Remplacé par PostgreSQL dans compose |
| Sécurité auth | ✅ | JWT httpOnly cookie + OAuth `state` CSRF |
| Payzone | ✅ | `/api/payments/initialize` + callback HMAC (credentials requis) |
| Bundle JS | ✅ | Code-splitting Plotly + lazy routes |

**Verdict :** déployable en **MVP production** sur un VPS OVH après configuration `.env`, DNS, SSL et tests manuels des parcours critiques (inscription, onboarding, dashboard, paiement).

---

## 3. Erreurs potentielles bloquantes

### Corrigées dans ce dépôt

1. **Proxy Nginx `/api`** — préfixe `/api` préservé vers FastAPI
2. **`psycopg2-binary`** — ajouté pour PostgreSQL en Docker
3. **`create_all()`** — désactivé quand `APP_ENV=production` (Alembic uniquement)
4. **Mock Google OAuth** — refusé en production sans `GOOGLE_CLIENT_ID`
5. **Webhook paiement** — header `X-Webhook-Secret` requis en production
6. **`/api/healthz`** — endpoint health avec test connexion DB

### À traiter avant / pendant le déploiement

| # | Problème | Impact | Solution |
|---|----------|--------|----------|
| 1 | `SECRET_KEY` faible ou manquant | Backend ne démarre pas | `openssl rand -hex 32` dans `.env` |
| 2 | `FRONTEND_ORIGIN` incorrect | Erreurs CORS | Mettre `https://votredomaine.ma` |
| 3 | Google OAuth redirect URI | Login Google échoue | Ajouter `https://domaine.ma/api/auth/google/callback` dans Google Console |
| 4 | `PAYZONE_CALLBACK_URL` HTTP | Webhook refusé | URL HTTPS publique obligatoire |
| 5 | Payzone non implémenté (mock) | Paiements carte simulés | OK pour MVP ; intégrer Payzone réel avant prod paiements |
| 6 | `VITE_*` build-time | OAuth/PayPal absents si non set | Remplir `.env` avant `docker compose build` |

---

## 4. Architecture OVH recommandée (peu coûteuse)

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  OVH VPS        │
              │  (Ubuntu 24.04) │
              │                 │
              │  Nginx :443     │◄── Let's Encrypt (Certbot)
              │       │         │
              │  127.0.0.1:8080 │
              │       ▼         │
              │  ┌──────────┐   │
              │  │ frontend │   │  nginx + React static
              │  │  :80     │───┼──► proxy /api → backend
              │  └────┬─────┘   │
              │       │         │
              │  ┌────▼─────┐   │
              │  │ backend  │   │  FastAPI :8000 (réseau interne)
              │  └────┬─────┘   │
              │       │         │
              │  ┌────▼─────┐   │
              │  │ Postgres │   │  volume postgres_data
              │  └──────────┘   │
              └─────────────────┘
```

### Offre OVH suggérée

| Option | Prix indicatif | Usage |
|--------|----------------|-------|
| **VPS-1** (4 vCore, 8 Go RAM, 75 Go SSD) | ~5–8 €/mois | **Recommandé MVP** — marge pour scans + Plotly |
| VPS-0 (2 vCore, 4 Go) | ~3–5 €/mois | Possible mais serré au pic mémoire |
| Domaine `.ma` | ~10–15 €/an | Chez OVH ou registrar local |
| Snapshot VPS | ~1–2 €/mois | Sauvegarde disque complète (optionnel) |

**Coût total estimé MVP :** ~8–12 €/mois (VPS + domaine amorti).

---

## 5. Fichiers de déploiement générés

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Orchestration db + backend + frontend |
| `.env.production.example` | Template variables production |
| `deploy/nginx/perenai.conf` | Nginx hôte + SSL |
| `deploy/scripts/setup-server.sh` | Installation initiale VPS (Docker, UFW, Nginx) |
| `deploy/scripts/deploy.sh` | Mise à jour / rebuild |
| `deploy/scripts/backup-db.sh` | Sauvegarde PostgreSQL quotidienne |
| `frontend/nginx.conf` | Proxy `/api` corrigé |

---

## 6. Commandes exactes sur le serveur OVH

### Phase A — Provisionnement VPS

```bash
# Connexion SSH (remplacer IP et utilisateur)
ssh ubuntu@VOTRE_IP_OVH

# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Outils de base
sudo apt install -y git curl ufw fail2ban certbot python3-certbot-nginx

# Docker (méthode officielle)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Se déconnecter/reconnecter pour appliquer le groupe docker

# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Phase B — Déploiement application

```bash
# Répertoire applicatif
sudo mkdir -p /opt/perenai
sudo chown $USER:$USER /opt/perenai
cd /opt/perenai

# Cloner le dépôt (ou rsync/scp depuis votre machine)
git clone https://github.com/VOTRE_ORG/perenai-website.git .
# OU: scp -r ./perenai-website ubuntu@IP:/opt/perenai/

# Configuration environnement
cp .env.production.example .env
nano .env   # SECRET_KEY, POSTGRES_PASSWORD, domaine, OAuth, Payzone

# Générer une clé secrète
openssl rand -hex 32

# Build et démarrage
docker compose up -d --build

# Vérifier les services
docker compose ps
docker compose logs -f backend
curl -s http://127.0.0.1:8080/api/healthz || curl -s http://127.0.0.1:8080/healthz
```

### Phase C — Nginx + SSL

```bash
sudo apt install -y nginx
sudo mkdir -p /var/www/certbot

# Adapter le domaine dans le fichier avant copie
sudo sed -i 's/perenai.ma/VOTRE-DOMAINE.ma/g' deploy/nginx/perenai.conf
sudo cp deploy/nginx/perenai.conf /etc/nginx/sites-available/perenai.conf
sudo ln -sf /etc/nginx/sites-available/perenai.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Certificat SSL (première fois — nginx peut échouer sur ssl_certificate, c'est normal)
sudo certbot certonly --webroot -w /var/www/certbot -d VOTRE-DOMAINE.ma -d www.VOTRE-DOMAINE.ma
sudo nginx -t && sudo systemctl reload nginx

# Renouvellement auto (certbot installe généralement un timer systemd)
sudo certbot renew --dry-run
```

### Phase D — Sauvegardes

```bash
chmod +x deploy/scripts/backup-db.sh deploy/scripts/deploy.sh
sudo mkdir -p /var/backups/perenai

# Cron quotidien 03:00
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/perenai/deploy/scripts/backup-db.sh") | crontab -
```

### Mises à jour ultérieures

```bash
cd /opt/perenai
./deploy/scripts/deploy.sh
```

---

## 7. Domaine, SSL, sécurité, sauvegardes

### DNS (zone OVH)

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | `@` | IP du VPS | 3600 |
| A | `www` | IP du VPS | 3600 |

Propagation : 5 min à 48 h (souvent < 1 h).

### SSL / HTTPS

- **Let's Encrypt** via Certbot (gratuit, renouvellement automatique).
- Forcer HTTPS : redirection HTTP→HTTPS dans `deploy/nginx/perenai.conf`.
- HSTS (optionnel, après validation) : `add_header Strict-Transport-Security "max-age=31536000" always;`

### Sécurité

1. **SSH** : clés uniquement, désactiver mot de passe (`PasswordAuthentication no`).
2. **UFW** : ports 22, 80, 443 uniquement.
3. **fail2ban** : protection SSH et Nginx.
4. **Secrets** : `.env` jamais commité ; permissions `chmod 600 .env`.
5. **PostgreSQL** : non exposé hors réseau Docker.
6. **CORS** : `FRONTEND_ORIGIN` = domaine exact HTTPS.
7. **Google OAuth** : origines JS = `https://domaine.ma`.
8. **Mises à jour** : `apt upgrade` mensuel + rebuild images Docker.

### Sauvegardes (stratégie 3-2-1 simplifiée)

| Niveau | Méthode | Fréquence |
|--------|---------|-----------|
| Base de données | `backup-db.sh` → `/var/backups/perenai` | Quotidien |
| Snapshot VPS OVH | Snapshot disque | Hebdomadaire (option payante) |
| Code | Git distant | À chaque push |

Restauration DB :

```bash
gunzip -c /var/backups/perenai/perenai_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U perenai perenai
```

---

## 8. Configuration Google OAuth (production)

Dans [Google Cloud Console](https://console.cloud.google.com/) :

- **Authorized JavaScript origins :** `https://VOTRE-DOMAINE.ma`
- **Authorized redirect URIs :** `https://VOTRE-DOMAINE.ma/api/auth/google/callback`

Dans `.env` :

```env
FRONTEND_ORIGIN=https://VOTRE-DOMAINE.ma
GOOGLE_CALLBACK_URL=https://VOTRE-DOMAINE.ma/api/auth/google/callback
```

---

## 9. Configuration Payzone

```env
PAYZONE_MERCHANT_ID=votre_merchant_id
PAYZONE_SECRET_KEY=votre_cle_secrete
PAYZONE_CALLBACK_URL=https://VOTRE-DOMAINE.ma/api/payments/callback
PAYZONE_RETURN_SUCCESS_URL=https://VOTRE-DOMAINE.ma/payment/success
PAYZONE_RETURN_FAILURE_URL=https://VOTRE-DOMAINE.ma/payment/failure
```

Valider avec Payzone que l'URL de callback webhook est bien enregistrée côté marchand.

---

## 10. Checklist finale avant mise en production

### Infrastructure

- [ ] VPS OVH provisionné (Ubuntu 24.04 LTS)
- [ ] DNS A / www pointent vers l'IP du VPS
- [ ] UFW actif (22, 80, 443)
- [ ] Docker + Docker Compose installés
- [ ] Nginx hôte configuré
- [ ] Certificat SSL valide (cadenas vert)
- [ ] Renouvellement SSL testé (`certbot renew --dry-run`)

### Application

- [ ] `.env` production rempli (SECRET_KEY, POSTGRES_PASSWORD)
- [ ] `docker compose up -d --build` sans erreur
- [ ] `docker compose ps` — tous les services healthy
- [ ] `GET https://domaine.ma` — landing page
- [ ] `GET https://domaine.ma/api/healthz` ou healthz backend — OK
- [ ] Inscription email/mot de passe
- [ ] Connexion Google OAuth
- [ ] Onboarding complet + sauvegarde
- [ ] Dashboard / Score Dashboard (digital twin, scanners anatomiques)
- [ ] Scan facial (permission caméra HTTPS requis)
- [ ] Flux paiement (sandbox puis production Payzone)
- [ ] Cron sauvegarde DB actif
- [ ] Logs backend sans erreurs critiques (`docker compose logs backend`)

### Légal / conformité (MVP santé)

- [ ] Politique de confidentialité
- [ ] Mentions légales
- [ ] Consentement traitement données biométriques

---

## 11. Répartition des actions

### Actions réalisées (analyse + préparation)

- Analyse stack et état production
- Identification des blockers (proxy API, SQLite, secrets)
- Correction `frontend/nginx.conf` (préfixe `/api`)
- Ajout `psycopg2-binary`, durcissement production (auth mock, webhook)
- Génération `docker-compose.yml`, `.env.production.example`
- Nginx hôte + scripts setup/deploy/backup
- Documentation `DEPLOYMENT_OVH.md` + `CHECKLIST_PRODUCTION.md`

### Actions à réaliser par vous sur OVH (étape par étape)

1. Commander un **VPS** OVH (VPS-1 recommandé) + domaine `.ma`
2. Configurer les **enregistrements DNS** (A @ et www)
3. Se connecter en **SSH** et installer Docker, Nginx, Certbot, UFW
4. Cloner/uploader le projet dans `/opt/perenai`
5. Copier `.env.production.example` → `.env` et remplir tous les secrets
6. Lancer `docker compose up -d --build`
7. Installer la config Nginx et obtenir le **certificat SSL**
8. Configurer **Google OAuth** et **Payzone** avec les URLs HTTPS
9. Tester tous les parcours utilisateur
10. Activer le **cron de sauvegarde** DB
11. (Optionnel) Activer les **snapshots VPS** OVH

### Risques et solutions

| Risque | Probabilité | Solution |
|--------|-------------|----------|
| CORS / OAuth redirect mismatch | Élevée | Vérifier `FRONTEND_ORIGIN` et URIs Google |
| API 404 en production | Moyenne (corrigé) | Tester `/api/healthz` après deploy |
| Postgres disque plein | Faible | Monitoring `df -h` + rotation backups |
| Fuite `.env` | Faible | `chmod 600`, ne jamais committer |
| DDoS / brute-force | Moyenne | UFW + fail2ban + rate limit Nginx |
| Payzone webhook non reçu | Moyenne | URL HTTPS publique + logs `docker compose logs backend` |
| Bundle JS lourd (LCP lent) | Moyenne | Code-splitting ultérieur ; CDN optionnel |
| Perte de données | Faible | Backups quotidiens + snapshot VPS |
| Non-conformité RGPD | Variable | Hébergement UE, DPA, politique données santé |

---

## 12. Modifications UI récentes (dashboard)

- **Interactive Biometric Map** : section retirée du Score Dashboard.
- **Anatomical System Scanners** : section principale en pleine largeur ; squelettes en SVG vectoriel (crâne, colonne, côtes, muscles, graisse).
- **Chronological Twin State History** : placé directement sous les scanners anatomiques.

---

## Support rapide

```bash
# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Redémarrage
docker compose restart backend frontend

# État santé
docker compose ps
curl -I https://VOTRE-DOMAINE.ma
```
