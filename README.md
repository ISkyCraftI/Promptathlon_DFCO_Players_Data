# Easyfoot

Base SaaS simple : **Angular (PrimeNG)** + **FastAPI (MVC)** + **SQLite** + **Docker**.

Sans authentification. Architecture documentée pour les IA dans [`AGENTS.md`](./AGENTS.md).

## Prérequis locaux

- Python 3.12+ (venv déjà créé à la racine : `.venv`)
- Node.js 20+ / npm
- Docker (optionnel)

## Démarrage local

### Backend

```bash
# depuis la racine
.\.venv\Scripts\activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 5059
```

API : `http://localhost:5059/api/health/`  
Docs Swagger : `http://localhost:5059/docs`  
ReDoc : `http://localhost:5059/redoc`

### Frontend

```bash
cd frontend
npm start
```

App : `http://localhost:8089`

En local, le front proxyfie `/api` vers `http://localhost:5059` (`proxy.conf.json`).

## Docker

1. Remplacer `DOCKERHUB_USER` dans `docker-compose.yml` par ton user Docker Hub.
2. Local (build depuis le code) :

```bash
docker compose up --build
```

3. Serveur (pull images uniquement) : déployer **seulement** `docker-compose.yml` (sans override), puis :

```bash
docker compose pull
docker compose up -d
```

- Frontend HTTPS : `https://<host>:8089`
- Backend : `http://<host>:5059`

Certificats : placer `fullchain.pem` + `privkey.pem` dans `./certs/`, sinon certificat auto-signé généré au démarrage.

## Ajouter une feature

Voir [`docs/FEATURE_WORKFLOW.md`](./docs/FEATURE_WORKFLOW.md).
