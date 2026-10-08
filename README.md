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

## Effectif et fiches joueurs

La page `/effectif` présente les 30 joueurs du DFCO, les disponibilités, les notes
générales et les situations à examiner. Recherche, filtres de poste et de santé
permettent d'accéder directement à une fiche `/effectif/<id>`.

Les fiches regroupent identité, graphique des qualités, attributs détaillés,
matchs, GPS, charge sur 14 jours, parcours de réathlétisation et historique.
Les alertes conduisent à la rubrique concernée. Le mode « Joueur » ouvre le bilan
personnel ; les observations, fatigue et gêne déclarées sont enregistrées en SQLite
et restent disponibles après rechargement. Ces modes sont des vues de démonstration,
sans authentification ni restriction d'accès.

Les attributs importés FC27 affichent leur source FUTWIZ. Les joueurs sans fiche
importée restent identifiés comme simulés. Santé, blessures, relations, GPS,
matchs et charge sont des données de démonstration : aucun capteur ou fournisseur
de matchs n'est connecté. Les alertes sont des règles de lecture pour le staff,
et l'avancement de réathlétisation illustre les dates prévues sans valider un retour.

Le démarrage du backend importe les joueurs absents depuis
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
