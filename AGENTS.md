# Easyfoot — Contexte architecture pour IA

Ce fichier est la **source de vérité**. Toute feature doit respecter ces règles.
Inspiré de `accountsv2` (HTTP client, erreurs API, Docker), simplifié en **MVC** sans auth.

---

## Vue d'ensemble

| Couche | Techno | Port |
|--------|--------|------|
| Frontend | Angular 21 + PrimeNG uniquement | `8089` |
| Backend | FastAPI (MVC) | `5059` (pas `5060` : bloqué par Chrome `ERR_UNSAFE_PORT`) |
| DB | SQLite (fichier, **jamais versionné**) | `backend/data/app.db` |

- **Pas d'authentification.**
- API préfixée par `/api`.
- En Docker, nginx (frontend) sert le SPA en **HTTPS** et reverse-proxy `/api/` vers le backend.

---

## Arborescence obligatoire

```
Easyfoot/
├── AGENTS.md                 # CE FICHIER — lire en premier
├── docs/FEATURE_WORKFLOW.md  # checklist ajout de feature
├── docker-compose.yml        # images Docker Hub (serveur)
├── docker-compose.override.yml  # builds locaux (ne pas déployer sur serveur)
├── certs/                    # TLS (gitignored sauf .gitkeep)
├── backend/
│   ├── main.py               # FastAPI app, CORS, exception handlers
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── config.py
│   │   ├── lifespan.py
│   │   ├── dependencies.py
│   │   ├── shared/
│   │   │   ├── db/           # Base ORM + session SQLite
│   │   │   ├── exceptions.py # AppError → contrat ErrorSchema
│   │   │   └── router.py     # agrège toutes les views
│   │   └── features/<name>/  # UNE feature = 1 dossier
│   │       ├── model.py      # Model (SQLAlchemy ORM)
│   │       ├── schemas.py    # DTOs Pydantic (entrée/sortie API)
│   │       ├── controller.py # Controller (logique métier)
│   │       └── view.py       # View = APIRouter (routes HTTP)
│   └── data/                 # SQLite runtime (gitignore)
└── frontend/
    ├── src/
    │   ├── environments/     # apiBaseUrl prod=/api ; dev=http://localhost:5059/api
    │   └── app/
    │       ├── shared/       # AsyncHttpClient, interceptors, errors
    │       └── <feature>/    # service + model zod + page/composants
    ├── nginx.conf
    └── Dockerfile
```

---

## Backend — pattern MVC

| Couche | Fichier | Rôle |
|--------|---------|------|
| **Model** | `model.py` | Table SQLAlchemy, hérite de `Base` |
| **View** | `view.py` | `APIRouter` : HTTP in/out uniquement |
| **Controller** | `controller.py` | Logique métier + accès DB |
| **Schemas** | `schemas.py` | Pydantic Create/Update/Read |

### Règles strictes

1. Une feature = un dossier sous `app/features/<name>/`.
2. Les routes vivent uniquement dans `view.py` (les "views").
3. `view.py` instancie le controller ; **pas de SQL dans la view**.
4. Enregistrer le router dans `app/shared/router.py`.
5. Si nouveau model ORM : l'importer dans `app/shared/db/session.py` (bootstrap `create_all`).
6. Erreurs métier → `AppError` puis `HTTPException(detail=e.to_detail())`.
7. Format d'erreur **immuable** (contrat front) :

```json
{
  "detail": {
    "user_safe_title": "...",
    "user_safe_description": "...",
    "dev": "..."
  }
}
```

8. Préfixe global `/api` (config `APP_PREFIX`). Exemple : `GET /api/items/`.
9. **Pas d'auth**, pas de JWT, pas de guards backend.
10. SQLite via `DB_PATH` ; ne jamais committer `*.db`.
11. CORS : origines explicites (jamais `*` avec `allow_credentials=True`).
12. Côté front, appeler les collections avec slash final (`/items/`) pour éviter le 307 FastAPI.

### Exemple de référence

Feature `items` = template à copier pour toute nouvelle feature CRUD.

---

## Frontend — Angular + PrimeNG

### Règles strictes

1. **UI = PrimeNG uniquement** (sauf composant inexistant chez PrimeNG).
2. Communication HTTP **uniquement** via `AsyncHttpClient` (`shared/services/async-http-client.ts`).
3. Jamais d'`HttpClient` direct dans un service de feature.
4. Endpoints relatifs : `"/items"`, `"/health/"` — le client préfixe `environment.apiBaseUrl`.
5. Valider les réponses avec **Zod** dans le model de feature.
6. Erreurs API gérées par `errorInterceptor` → `ErrorWrapper`.
7. Pattern refresh : `BehaviorSubject` + `toSignal` comme `ItemsService` (inspiré accountsv2).
8. `environment.ts` (prod) : `apiBaseUrl: "/api"` (nginx proxy).
9. `environment.development.ts` : `apiBaseUrl: "/api"` + `proxy.conf.json` → `localhost:5059` (évite CORS en local).
10. Strings en **double quotes** `"` dans le code généré.

### Structure d'une feature front

```
app/<feature>/
  <feature>.model.ts      # Zod schemas + types
  <feature>.service.ts    # appelle AsyncHttpClient
  <feature>.page/         # page routée (PrimeNG)
```

### Menu

- Barre haute : `shared/components/menu-bar/`
- Ajouter chaque feature dans `MenuBar.items`
  (`{ label, routerLink }`).
- Branding Easyfoot : le « e » du logo est
  `public/brand/easyfoot-e.png` ; couleurs DFCO dans
  `styles.css` / `theme/easyfoot.preset.ts`.
  Ne pas écrire le nom de l’école dans l’UI.

### Feature EXAMPLE

- `items` (backend + frontend) est **commentée / désactivée**.
- Garder le code comme template ; ne pas la supprimer.

---

## Communication HTTP (contrat accountsv2)

```
Angular Page
  → FeatureService
    → AsyncHttpClient.get|post|put|delete("/resource")
      → GET/POST/... {apiBaseUrl}/resource
        → FastAPI view (router)
          → Controller
            → Model / Session SQLite
```

- Dev local : front `8089` → API directe `http://localhost:5059/api`.
- Docker : front HTTPS `8089` → nginx `/api/` → `http://backend:5059/api/`.

---

## Docker

| Fichier | Usage |
|---------|--------|
| `docker-compose.yml` | Images `DOCKERHUB_USER/Easyfoot:{backend,frontend}` |
| `docker-compose.override.yml` | `build: ./backend` et `./frontend` (local) |

### Serveur (sans code source)

1. Remplacer `DOCKERHUB_USER` dans `docker-compose.yml`.
2. **Ne pas** copier `docker-compose.override.yml` sur le serveur.
3. `docker compose pull && docker compose up -d`
4. Front HTTPS : `https://<host>:8089` — Back : `http://<host>:5059`
5. Certs : monter `./certs` (`fullchain.pem`, `privkey.pem`) ou laisser l'entrypoint générer un self-signed.

### Local (avec code)

```bash
docker compose up --build
```

L'override déclenche le build si le code est présent.

### Push images

```bash
docker build -t DOCKERHUB_USER/Easyfoot:backend ./backend
docker build -t DOCKERHUB_USER/Easyfoot:frontend ./frontend
docker push DOCKERHUB_USER/Easyfoot:backend
docker push DOCKERHUB_USER/Easyfoot:frontend
```

---

## Interdits

- Versionner `.env`, `.venv`, `node_modules`, `*.db`, certificats, `dist/`, `.angular/`
- Ajouter une lib UI autre que PrimeNG sans nécessité
- Mettre de la logique métier dans `view.py` ou dans un composant Angular
- Introduire de l'authentification sans demande explicite
- Changer le format `detail.user_safe_*` des erreurs

---

## Checklist rapide avant de commit une feature

Voir `docs/FEATURE_WORKFLOW.md`.
