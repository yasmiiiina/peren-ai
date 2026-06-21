# Déploiement PEREN AI sur AWS — Guide étape par étape

**Objectif :** déployer l'application sur AWS EC2, accessible via **https://peren.ai**

**Domaine :** peren.ai (Route 53 ou registrar externe)

---

## État de préparation du projet (Phase 1 — fait dans le dépôt)

| Étape encadrant | Statut | Détail |
|-----------------|--------|--------|
| 1. Fonctionne en local | ✅ | `npm run dev` + `uvicorn` ou Docker |
| 2. Arborescence | ✅ | `frontend/`, `backend/`, `docker-compose.yml`, `.env.example` |
| 3. docker-compose.yml | ✅ | PostgreSQL + backend + frontend |
| 4. Variables d'environnement | ✅ | `.env.example` + `.env.production.example` |
| 5–6. Docker local | ⚠️ | À tester sur votre machine : `docker compose build && docker compose up` |
| 7. Branche production | ⬜ | À créer par l'équipe : `git checkout -b production` |

---

## Arborescence du projet

```
perenai-website/
├── frontend/                 # React 18 + Vite
├── backend/                  # FastAPI + PostgreSQL
├── deploy/
│   ├── nginx/
│   │   ├── peren.ai.conf     # Nginx AWS (peren.ai)
│   │   └── perenai.conf      # Nginx OVH (legacy)
│   └── scripts/
│       ├── setup-aws.sh      # Installation EC2
│       ├── deploy.sh         # Mise à jour
│       └── backup-db.sh      # Sauvegarde PostgreSQL
├── docker-compose.yml
├── .env.example              # Dev local
├── .env.production.example   # Production AWS
├── DEPLOYMENT_AWS.md         # Ce guide
└── CHECKLIST_AWS.md          # Checklist rapide
```

---

## PHASE 1 : Préparation locale (avant AWS)

### Étape 1 — Tester en local

```powershell
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

Vérifier : landing, inscription, connexion email, **Google (mock si pas de clés)**, dashboard, scan facial, abonnements `/pricing`.

### Google OAuth — erreur `invalid_client`

**Cause :** `GOOGLE_CLIENT_ID` contient un placeholder (`TON_VRAI_CLIENT_ID...`) au lieu d'une vraie clé ou d'être vide.

| Environnement | Configuration |
|---------------|---------------|
| **Dev local** | Laisser `GOOGLE_CLIENT_ID=` et `GOOGLE_CLIENT_SECRET=` **vides** → connexion Google mock automatique |
| **Production peren.ai** | Vraies clés Google Cloud Console (voir ci-dessous) |

### OpenAI — recommandations IA

Les fonctionnalités IA (Digital Twin premium, analyse de scan facial, interprétation biomarqueurs) utilisent l'API OpenAI quand `OPENAI_API_KEY` est configurée. Sans clé, le backend bascule automatiquement sur des algorithmes locaux.

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI (obligatoire en production pour l'IA réelle) |
| `OPENAI_MODEL` | Modèle (défaut : `gpt-4o-mini`) |

Vérifier : `curl https://peren.ai/api/ai/status` → `{"available":true,"provider":"openai",...}`

### Étape 5–6 — Tester Docker local

```bash
cp .env.production.example .env
# Remplir POSTGRES_PASSWORD et SECRET_KEY minimum
docker compose build
docker compose up
docker compose ps
docker compose logs
curl http://127.0.0.1:8080/api/healthz
```

---

## PHASE 2 : Préparation AWS

### Étape 8 — Accès AWS

Confirmer : EC2, Route 53 (ou accès DNS peren.ai), IAM.

### Étape 9 — Domaine peren.ai

Vérifier accès DNS pour créer les enregistrements A.

---

## PHASE 3 : Création EC2

### Étape 10 — Instance EC2

| Paramètre | Valeur |
|-----------|--------|
| Nom | `peren-production` |
| OS | Ubuntu 24.04 LTS |
| Type | **t3.medium** (2 vCPU, 4 Go RAM) |
| Disque | 30 Go gp3 |
| Security Group | SSH 22, HTTP 80, HTTPS 443 |

### Étape 11 — Noter

- IP publique EC2
- DNS public (ex. `ec2-xx-xx-xx-xx.eu-west-3.compute.amazonaws.com`)

---

## PHASE 4 : DNS (Route 53 ou registrar)

### Étape 12 — Enregistrements A

| Type | Nom | Valeur |
|------|-----|--------|
| A | `@` | IP_EC2 |
| A | `www` | IP_EC2 |

Attendre propagation (5 min – 48 h).

---

## PHASE 5 : Préparation serveur

### Étape 13–17 — SSH + installation

```bash
ssh ubuntu@IP_EC2

sudo bash deploy/scripts/setup-aws.sh
# Se déconnecter/reconnecter pour le groupe docker
docker --version
docker compose version
```

---

## PHASE 6 : Déploiement application

### Étape 18 — Cloner le projet

```bash
mkdir -p ~/peren && cd ~/peren
git clone URL_DU_REPO .
git checkout production   # si branche créée
```

### Étape 19 — Fichier `.env`

```bash
cp .env.production.example .env
nano .env
chmod 600 .env
```

**Générer les secrets :**
```bash
openssl rand -hex 32   # SECRET_KEY
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # PAYMENT_WEBHOOK_SECRET
```

**Variables obligatoires production :**

```env
FRONTEND_ORIGIN=https://peren.ai,https://www.peren.ai
GOOGLE_CALLBACK_URL=https://peren.ai/api/auth/google/callback
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
VITE_GOOGLE_CLIENT_ID=xxxx   # même valeur, rebuild frontend
```

### Google Cloud Console (production)

1. [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials
2. OAuth 2.0 Client ID → Web application
3. **Authorized redirect URIs :** `https://peren.ai/api/auth/google/callback`
4. Copier Client ID + Secret dans `.env`

### Étape 20–23 — Build et démarrage

```bash
docker compose build
docker compose up -d
docker compose ps          # 3 services healthy
docker compose logs backend --tail=50
curl -s http://127.0.0.1:8080/api/healthz
```

---

## PHASE 7 : HTTPS

### Étape 24–26 — Nginx + Certbot

```bash
sudo cp deploy/nginx/peren.ai.conf /etc/nginx/sites-available/peren.ai.conf
sudo ln -sf /etc/nginx/sites-available/peren.ai.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

sudo certbot --nginx -d peren.ai -d www.peren.ai
sudo certbot renew --dry-run
```

### Étape 27 — Vérifier

Ouvrir **https://peren.ai** — cadenas SSL actif.

---

## PHASE 8 : Validation finale

### Étape 28 — Tests fonctionnels

- [ ] Landing page
- [ ] Inscription email
- [ ] Connexion email
- [ ] **Connexion Google** (vraies clés configurées)
- [ ] Onboarding
- [ ] Dashboard / Score Dashboard
- [ ] Scan facial (HTTPS requis pour caméra)
- [ ] Manage Subscription `/pricing`
- [ ] Paiement (Payzone/PayPal si configuré)

### Étape 29 — Logs

```bash
docker compose logs --tail=100
```

### Étape 30 — Documentation passation

Conserver :
- IP EC2, domaine, URL repo
- Procédure mise à jour : `./deploy/scripts/deploy.sh`
- Sauvegarde DB : `./deploy/scripts/backup-db.sh` + cron
- Liste variables `.env` (sans valeurs secrètes)

---

## Commandes utiles

```bash
cd ~/peren
docker compose up -d --build      # redémarrage
docker compose ps
docker compose logs -f backend
./deploy/scripts/deploy.sh        # mise à jour depuis Git
./deploy/scripts/backup-db.sh     # backup manuel
```

## Mise à jour application

```bash
cd ~/peren
git pull
docker compose build
docker compose up -d
```

## Restauration base de données

```bash
gunzip -c /var/backups/perenai/perenai_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U perenai perenai
```

---

## Coût AWS estimé

| Ressource | Coût indicatif |
|-----------|----------------|
| EC2 t3.medium | ~30–35 USD/mois |
| EBS 30 Go | ~3 USD/mois |
| Route 53 (si utilisé) | ~0,50 USD/mois |
| **Total** | **~35–40 USD/mois** |

---

## Ce qu'il reste à faire (équipe / encadrant)

### Côté code — ✅ prêt

- Docker, nginx, scripts, templates `.env`, docs AWS

### Côté infrastructure — ⬜ à faire

1. Créer EC2 t3.medium Ubuntu 24.04
2. Configurer Security Group (22, 80, 443)
3. DNS A `@` et `www` → IP EC2
4. Créer branche `production` sur GitHub
5. Cloner sur le serveur et remplir `.env`
6. **Créer OAuth Google** pour peren.ai (vraies clés)
7. `docker compose up -d --build`
8. Nginx + Certbot SSL
9. Tests complets étape 28
10. Cron backup DB

### Côté légal (MVP santé)

- Politique de confidentialité
- Mentions légales
- Consentement données biométriques
