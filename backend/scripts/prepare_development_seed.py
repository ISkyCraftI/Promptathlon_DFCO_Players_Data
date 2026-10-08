"""Generate fictional youth fixtures and adapt existing prospect data for comparison."""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROLES = {"GK": "Gardien", "CB": "Défenseur", "LB": "Défenseur", "RB": "Défenseur", "CDM": "Milieu",
    "CM": "Milieu", "CAM": "Milieu", "LM": "Milieu", "RM": "Milieu", "LW": "Attaquant", "RW": "Attaquant", "ST": "Attaquant"}
KEYS = ["vitesse", "frappe", "passe", "dribble", "defense", "physique"]
GK_KEYS = ["plongeon", "prise", "jeu_pied", "reflexes", "vitesse", "placement"]
NAMES = ["Léo Martin", "Adam Perrin", "Noah Laurent", "Elias Morel", "Gabriel Roux", "Lucas Bernard",
    "Amir Petit", "Jules Girard", "Sacha Robert", "Mathis Dubois", "Ilyes Faure", "Louis Garnier",
    "Nolan Mercier", "Raphaël Blanc", "Yanis Colin", "Hugo Chevalier", "Arthur André", "Malo Leclerc",
    "Naël Simon", "Enzo Nicolas"]
POSITIONS = ["CM", "ST", "CB", "GK", "LB", "CAM", "RW", "CDM", "ST", "RB", "CM", "GK", "LW", "CB", "CAM", "ST", "LM", "CB", "CDM", "GK"]
rng = random.Random(20261008)
youth = []
for index, (name, position) in enumerate(zip(NAMES, POSITIONS)):
    keys = GK_KEYS if position == "GK" else KEYS
    base = [57, 50, 51, 63, 44, 52][index % 6]
    ratings = {key: min(88, max(25, base + rng.randint(-12, 13))) for key in keys}
    if index % 7 == 1:
        ratings.update({key: None for key in keys[3:]})
    if index == 2:
        ratings = {key: None for key in keys}
    youth.append(dict(id=f"YOUTH_{index + 1:03d}", name=name, category="youth", age=15 + index % 6,
        position=position, role=ROLES[position], foot=rng.choice(["Droit", "Gauche"]),
        height=rng.randint(162, 192), weight=round(rng.uniform(54, 81), 1), ratings=ratings,
        observations=0 if index == 2 else rng.randint(1, 7), minutes=None if index == 2 else rng.randint(90, 720),
        assessed_on=None if index == 2 else "2026-10-08", demo=True,
        note="Jeune joueur fictif pour tester le parcours de formation. Aucune identité ni évaluation réelle."))

data = json.loads((ROOT / "data/dfco_simulation.json").read_text(encoding="utf-8"))
prospects = []
for p in data["joueurs"]:
    if p["type_joueur"] == "DFCO":
        continue
    position = p.get("poste_fc27") or {"Gardien": "GK", "Défenseur": "CB", "Milieu": "CM", "Attaquant": "ST"}[p["groupe_poste"]]
    keeper = ["gardien_plongeon", "gardien_prise_de_balle", "gardien_jeu_au_pied", "gardien_reflexes", "gardien_vitesse", "gardien_placement"]
    keys = GK_KEYS if position == "GK" else KEYS
    prospects.append(dict(id=p["joueur_id"], name=p["nom"], category="prospect", age=p["age"], position=position,
        role=ROLES[position], foot=p["pied_fort"], height=p["taille_cm"], weight=p["poids_kg"],
        ratings={key: p.get(keeper[i]) if position == "GK" else p.get("note_" + key) for i, key in enumerate(keys)},
        observations=0, minutes=None, assessed_on="2026-10-08", demo=True,
        note="Profil de démonstration issu du jeu de prospects existant ; suivi de recrutement géré séparément."))

metadata = {"version": 1, "reference_date": "2026-10-08", "rating_scale": "0–100",
    "notice": "20 jeunes entièrement fictifs. Profils de comparaison de démonstration ; aucune prédiction de carrière.",
    "missing": "null = non renseigné, jamais zéro par défaut"}
(ROOT / "data/jeunes_joueurs.json").write_text(json.dumps(dict(metadata=metadata, players=youth), ensure_ascii=False, indent=2), encoding="utf-8")
(ROOT / "backend/resources/development.json").write_text(json.dumps(dict(metadata=metadata, players=youth + prospects), ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Prepared {len(youth)} youth profiles and {len(prospects)} prospect profiles")
