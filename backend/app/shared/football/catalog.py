"""Référentiel football partagé par toutes les features (attributs, groupes, postes).

Une seule source de vérité : le front récupère ce catalogue via l'API au lieu de le dupliquer.
"""

ROLES = ["Gardien", "Défenseur", "Milieu", "Attaquant"]

# Groupes FC (PAC / SHO / PAS / DRI / DEF / PHY) -> sous-attributs.
GROUPS: dict[str, dict] = {
    "vitesse": {"label": "Vitesse", "short": "VIT", "attributes": {
        "acceleration": "Accélération", "vitesse_de_pointe": "Vitesse de pointe"}},
    "frappe": {"label": "Frappe", "short": "TIR", "attributes": {
        "placement_offensif": "Placement offensif", "finition": "Finition", "puissance_de_tir": "Puissance de tir",
        "tir_de_loin": "Tir de loin", "volee": "Volée", "penalty": "Penalty"}},
    "passe": {"label": "Passe", "short": "PAS", "attributes": {
        "vista": "Vista", "centre": "Centre", "precision_coup_franc": "Coup franc", "passe_courte": "Passe courte",
        "passe_longue": "Passe longue", "effet": "Effet"}},
    "dribble": {"label": "Dribble", "short": "DRI", "attributes": {
        "agilite": "Agilité", "equilibre": "Équilibre", "reactivite": "Réactivité",
        "conduite_de_balle": "Conduite de balle", "dribble": "Dribble", "calme": "Calme"}},
    "defense": {"label": "Défense", "short": "DEF", "attributes": {
        "interception": "Interception", "precision_de_la_tete": "Jeu de tête", "lucidite_defensive": "Lucidité défensive",
        "tacle_debout": "Tacle debout", "tacle_glisse": "Tacle glissé"}},
    "physique": {"label": "Physique", "short": "PHY", "attributes": {
        "detente": "Détente", "endurance": "Endurance", "force": "Force", "agressivite": "Agressivité"}},
}

GOALKEEPING: dict[str, str] = {
    "gardien_plongeon": "Plongeon", "gardien_prise_de_balle": "Prise de balle", "gardien_jeu_au_pied": "Jeu au pied",
    "gardien_reflexes": "Réflexes", "gardien_vitesse": "Vitesse (GK)", "gardien_placement": "Placement",
    "gardien_sorties": "Sorties",
}

ATTRIBUTES: dict[str, list[str]] = {key: list(group["attributes"]) for key, group in GROUPS.items()}
FIELD_ATTRIBUTES: list[str] = [a for attrs in ATTRIBUTES.values() for a in attrs]
GK_ATTRIBUTES: list[str] = list(GOALKEEPING)

LABELS: dict[str, str] = {a: label for g in GROUPS.values() for a, label in g["attributes"].items()} | GOALKEEPING
GROUP_OF: dict[str, str] = {a: key for key, attrs in ATTRIBUTES.items() for a in attrs} | {a: "gardien" for a in GK_ATTRIBUTES}

# Importance de chaque sous-attribut par poste (0 à 3). Sert aux axes de progression
# et aux profils de recrutement par défaut. Choix éditorial documenté, ajustable par le staff.
ROLE_WEIGHTS: dict[str, dict[str, int]] = {
    "Gardien": {"gardien_plongeon": 3, "gardien_reflexes": 3, "gardien_placement": 3, "gardien_prise_de_balle": 2,
                "gardien_jeu_au_pied": 2, "gardien_sorties": 2, "gardien_vitesse": 1, "detente": 1, "calme": 1},
    "Défenseur": {"interception": 3, "lucidite_defensive": 3, "tacle_debout": 3, "precision_de_la_tete": 2,
                  "tacle_glisse": 2, "force": 2, "passe_courte": 2, "vitesse_de_pointe": 1, "acceleration": 1,
                  "detente": 1, "agressivite": 1, "passe_longue": 1, "calme": 1},
    "Milieu": {"passe_courte": 3, "vista": 3, "passe_longue": 2, "conduite_de_balle": 2, "calme": 2,
               "interception": 2, "endurance": 2, "reactivite": 2, "dribble": 1, "tir_de_loin": 1, "agilite": 1,
               "equilibre": 1},
    "Attaquant": {"finition": 3, "placement_offensif": 3, "acceleration": 2, "vitesse_de_pointe": 2, "dribble": 2,
                  "conduite_de_balle": 2, "puissance_de_tir": 2, "reactivite": 2, "precision_de_la_tete": 1,
                  "calme": 1, "agilite": 1, "volee": 1},
}

YOUNG_MAX_AGE = 21


def attributes_for(goalkeeper: bool) -> list[str]:
    return GK_ATTRIBUTES + FIELD_ATTRIBUTES if goalkeeper else FIELD_ATTRIBUTES


def catalog() -> dict:
    """Catalogue sérialisable exposé au front."""
    groups = [dict(key=k, label=g["label"], short=g["short"],
                   attributes=[dict(key=a, label=l) for a, l in g["attributes"].items()]) for k, g in GROUPS.items()]
    groups.append(dict(key="gardien", label="Gardien", short="GK",
                       attributes=[dict(key=a, label=l) for a, l in GOALKEEPING.items()]))
    return dict(roles=ROLES, groups=groups, role_weights=ROLE_WEIGHTS, young_max_age=YOUNG_MAX_AGE)
