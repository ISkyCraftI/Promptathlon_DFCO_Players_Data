# Workflow : ajouter une feature

Suivre ces étapes **dans l'ordre**. Exemple de référence : feature `items`.

## 1. Backend

1. Créer `backend/app/features/<name>/` (calcul partagé ? -> `app/shared/football/`)
2. Ajouter :
   - `model.py` — table SQLAlchemy (`Base`)
   - `schemas.py` — `Create` / `Update` / `Read`
   - `controller.py` — logique + session
   - `view.py` — `APIRouter(prefix="/<name>")`
3. Importer le model dans `app/shared/db/session.py` (bloc imports models).
4. `routes.include_router(...)` dans `app/shared/router.py`.
5. Erreurs métier via `AppError` + `HTTPException(detail=e.to_detail())`.

## 2. Frontend

1. Créer `frontend/src/app/<name>/`
2. Ajouter :
   - `<name>.model.ts` — Zod
   - `<name>.service.ts` — uniquement `AsyncHttpClient`
   - `<name>.page/` — page routée (PrimeNG + `shared/ui`)
   - `components/` — un dossier par composant de présentation
3. Déclarer la route dans `app.routes.ts` (avec `title` et `data.section` / `data.heading`).
4. Ajouter l'entrée menu dans `core/layout/navigation.ts`, ex. :
   `{ label: "Ma feature", icon: "pi-star", link: "/ma-feature" }`.
5. Ne pas utiliser `HttpClient` directement ; couleurs uniquement via les tokens `--ef-*`.

> La feature `items` (front + back) est **désactivée** mais
> conservée comme EXAMPLE / template à copier.

## 3. Vérifications

- [ ] Endpoint sous `/api/<name>/`
- [ ] Pas de fichier `.db` / `.env` / secrets dans le commit
- [ ] PrimeNG pour l'UI
- [ ] Contrat d'erreur `user_safe_title` / `user_safe_description` / `dev` respecté

## 4. Test local rapide

```bash
# terminal 1 — backend
cd backend
..\.venv\Scripts\uvicorn.exe main:app --reload --port 5059

# terminal 2 — frontend
cd frontend
npm start
```

Ouvrir `http://localhost:8089`.
