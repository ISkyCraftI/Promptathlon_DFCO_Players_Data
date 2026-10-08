"""Refresh the versioned seed from the project dataset before building Docker."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
source = json.loads(
    (root / "data" / "dfco_simulation.json").read_text(encoding="utf-8")
)
names = {p["joueur_id"]: p["nom"] for p in source["joueurs"]}
players = []
for player in source["joueurs"]:
    player["injuries"] = [
        b for b in source["blessures"]
        if b["joueur_id"] == player["joueur_id"]
    ]
    player["relations"] = [
        dict(r, target_name=names[r["joueur_cible_id"]])
        for r in source["relations"]
        if r["joueur_source_id"] == player["joueur_id"]
    ]
    players.append(player)
target = root / "backend" / "resources" / "players.json"
target.parent.mkdir(exist_ok=True)
target.write_text(
    json.dumps(
        {"reference_date": "2026-10-08", "players": players},
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
dfco = sum(1 for p in players if p["type_joueur"] == "DFCO")
prospects = sum(1 for p in players if p["type_joueur"] == "PROSPECT")
print(
    f"{len(players)} joueurs prêts "
    f"({dfco} DFCO + {prospects} prospects) "
    f"pour le démarrage local et Docker."
)
