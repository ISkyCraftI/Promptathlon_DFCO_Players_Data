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

## Fonctionnalités

| Page | Route | Contenu |
|------|-------|---------|
| Tableau de bord | `/tableau-de-bord` | Agrégation pour l'entraîneur : disponibilités, onze disponible (4-3-3), charge du groupe, forme, signaux, retours, derniers bilans, pistes de recrutement |
| Effectif | `/effectif` | 30 joueurs DFCO : statut, notes FC (VIT…PHY), zone de charge, fatigue ; filtres |
| Fiche joueur | `/effectif/<id>` | Identité, poste, carte de notes, attributs, physique et GPS, matchs, suivi (bilans, blessures, affinités) |
| Suivi physique | `/physique` | Charge aiguë / chronique (ACWR), signaux à examiner (marquer comme examiné), retours de blessure |
| Recrutement | `/recrutement` | Profils par poste (importance 0-3 par attribut), shortlist des 60 prospects, profils similaires |
| Jeunes vs pros | `/comparaison` | Jeune ≤ 21 ans vs pro DFCO du même poste : écarts, axes de progression, repères physiques |
| Mon suivi | `/mon-espace/<id>` | Vue joueur : forme, charge, objectifs, bilan du jour, échanges |

Thème clair / sombre (bouton en haut à droite), design détaillé dans [`docs/THEME.md`](./docs/THEME.md).

Les attributs importés FC27 affichent leur source FUTWIZ. Santé, blessures, relations, GPS, matchs et
charge sont des données de démonstration : aucun capteur ni fournisseur de matchs n'est connecté. Les
signaux sont des règles de lecture pour le staff ; l'avancement de réathlétisation illustre les dates
prévues sans valider un retour. Les modes « joueur » sont des vues de démonstration, sans authentification.

Le démarrage du backend importe les joueurs (effectif + prospects) et les profils de recrutement absents depuis
`backend/resources/players.json`, sans écraser les joueurs ni les bilans existants.
Pour régénérer ce fichier à partir du jeu de données :

```powershell
.\.venv\Scripts\python.exe backend/scripts/prepare_players_seed.py
```

Vérification du stockage et des contrats de données (base isolée en mémoire) :

```powershell
cd backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```
