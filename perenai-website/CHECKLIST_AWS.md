# Checklist AWS — PEREN AI (peren.ai)

## ✅ Validé dans le dépôt

- [x] `docker-compose.yml` (PostgreSQL + backend + frontend)
- [x] `.env.example` + `.env.production.example` (peren.ai)
- [x] `deploy/nginx/peren.ai.conf`
- [x] `deploy/scripts/setup-aws.sh`, `deploy.sh`, `backup-db.sh`
- [x] Build frontend OK (`npm run build`)
- [x] OAuth : rejet des placeholders Google (`invalid_client` corrigé en dev)
- [x] Abonnements unifiés (`PremiumSubscription`)
- [x] JWT httpOnly cookies + OAuth state CSRF
- [x] Intégration OpenAI (Digital Twin, scans, biomarqueurs) avec fallback local
- [x] Route `/api/health` corrigée et enregistrée

---

## ⬜ À faire sur AWS (obligatoire)

### Infrastructure
- [ ] EC2 `peren-production` — Ubuntu 24.04, t3.medium, 30 Go
- [ ] Security Group : 22, 80, 443
- [ ] DNS A `@` et `www` → IP EC2
- [ ] Branche Git `production`

### Serveur
- [ ] `ssh ubuntu@IP_EC2`
- [ ] `sudo bash deploy/scripts/setup-aws.sh`
- [ ] `git clone ... ~/peren`
- [ ] `cp .env.production.example .env` + remplir secrets
- [ ] `docker compose up -d --build`
- [ ] `curl http://127.0.0.1:8080/api/healthz`

### Google OAuth production
- [ ] [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Redirect URI : `https://peren.ai/api/auth/google/callback`
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` dans `.env`
- [ ] `VITE_GOOGLE_CLIENT_ID` identique → `docker compose build frontend`

### OpenAI production
- [ ] `OPENAI_API_KEY` dans `.env` serveur
- [ ] `OPENAI_MODEL=gpt-4o-mini` (ou autre modèle compatible JSON)
- [ ] `curl https://peren.ai/api/ai/status` → `"available": true`

### SSL
- [ ] `sudo cp deploy/nginx/peren.ai.conf /etc/nginx/sites-available/`
- [ ] `sudo certbot --nginx -d peren.ai -d www.peren.ai`

### Tests post-déploiement
- [ ] https://peren.ai
- [ ] Inscription + connexion email
- [ ] Connexion Google
- [ ] Dashboard + scan facial + analyse IA post-scan
- [ ] Upload biomarqueurs + interprétation IA
- [ ] /pricing (Manage Subscription)
- [ ] `docker compose logs` sans erreurs critiques

### Sauvegardes
- [ ] Cron : `0 3 * * * ~/peren/deploy/scripts/backup-db.sh`

---

## Secrets à générer

```bash
openssl rand -hex 32   # SECRET_KEY
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # PAYMENT_WEBHOOK_SECRET
```

## Google OAuth — dev vs prod

| Mode | GOOGLE_CLIENT_ID | Comportement |
|------|------------------|--------------|
| Dev local | **vide** | Mock Google (pas de redirect Google) |
| Production | **vraie clé** `.apps.googleusercontent.com` | OAuth Google réel |

**Ne jamais** laisser `TON_VRAI_CLIENT_ID...` — provoque `Erreur 401 : invalid_client`.
