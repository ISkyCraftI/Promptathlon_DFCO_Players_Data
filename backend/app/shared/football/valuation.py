"""
    Transparent Player Valuation Engine (TPE) : valeur de marché et plafond salarial auditables.

    Fonction pure (payload joueur -> valorisation), partagée par toutes les features qui affichent un prix.
"""

#
# Imports
#

from datetime import date

# Perso

from app.shared.football import simulation
from app.shared.football.catalog import ATTRIBUTES, GK_ATTRIBUTES

#
# Constants — Transparent Player Valuation Engine (TPE)
#

FORMULA_VERSION = "dfco-tpe-1.0"

# Ancre Ligue 2 (euros) : joueur médian de référence.
V_BASE_LIGUE2 = 750_000

# Multiplicateur de baseline selon le rôle tactique.
POSITION_BASE_MULT = {
    "Goalkeeper": 0.88,
    "Center-Back": 1.00,
    "Full-Back": 0.96,
    "Defensive Midfielder": 1.05,
    "Central Midfielder": 1.10,
    "Attacking Midfielder": 1.18,
    "Winger": 1.22,
    "Striker": 1.28,
}

POSITION_LABELS = {
    "Goalkeeper": "Gardien",
    "Center-Back": "Défenseur central",
    "Full-Back": "Latéral",
    "Defensive Midfielder": "Milieu défensif",
    "Central Midfielder": "Milieu central",
    "Attacking Midfielder": "Milieu offensif",
    "Winger": "Ailier",
    "Striker": "Attaquant",
}

# Matrice W_pos : poids des 6 clusters (somme = 1).
CLUSTER_WEIGHTS = {
    "Goalkeeper": {
        "vitesse": 0.05,
        "frappe": 0.02,
        "passe": 0.08,
        "dribble": 0.05,
        "defense": 0.10,
        "physique": 0.15,
        "_gk": 0.55,
    },
    "Center-Back": {
        "vitesse": 0.08,
        "frappe": 0.04,
        "passe": 0.12,
        "dribble": 0.08,
        "defense": 0.43,
        "physique": 0.25,
    },
    "Full-Back": {
        "vitesse": 0.22,
        "frappe": 0.06,
        "passe": 0.18,
        "dribble": 0.16,
        "defense": 0.24,
        "physique": 0.14,
    },
    "Defensive Midfielder": {
        "vitesse": 0.10,
        "frappe": 0.08,
        "passe": 0.20,
        "dribble": 0.12,
        "defense": 0.30,
        "physique": 0.20,
    },
    "Central Midfielder": {
        "vitesse": 0.12,
        "frappe": 0.12,
        "passe": 0.28,
        "dribble": 0.18,
        "defense": 0.15,
        "physique": 0.15,
    },
    "Attacking Midfielder": {
        "vitesse": 0.14,
        "frappe": 0.20,
        "passe": 0.28,
        "dribble": 0.24,
        "defense": 0.06,
        "physique": 0.08,
    },
    "Winger": {
        "vitesse": 0.25,
        "frappe": 0.18,
        "passe": 0.16,
        "dribble": 0.26,
        "defense": 0.05,
        "physique": 0.10,
    },
    "Striker": {
        "vitesse": 0.16,
        "frappe": 0.38,
        "passe": 0.10,
        "dribble": 0.18,
        "defense": 0.04,
        "physique": 0.14,
    },
}

# Sur-pondération intra-cluster (compétences décisives).
SUB_SKILL_BOOST = {
    "Striker": {"finition": 1.6, "placement_offensif": 1.4},
    "Center-Back": {
        "lucidite_defensive": 1.6,
        "tacle_debout": 1.3,
        "precision_de_la_tete": 1.25,
    },
    "Full-Back": {"centre": 1.4, "acceleration": 1.3, "endurance": 1.2},
    "Defensive Midfielder": {
        "interception": 1.45,
        "passe_courte": 1.2,
        "force": 1.2,
    },
    "Central Midfielder": {
        "vista": 1.4,
        "passe_courte": 1.25,
        "passe_longue": 1.2,
    },
    "Attacking Midfielder": {
        "vista": 1.5,
        "finition": 1.25,
        "dribble": 1.2,
    },
    "Winger": {
        "acceleration": 1.4,
        "vitesse_de_pointe": 1.35,
        "dribble": 1.3,
        "centre": 1.25,
    },
    "Goalkeeper": {},
}

GK_SUB_WEIGHTS = {
    "gardien_reflexes": 0.22,
    "gardien_plongeon": 0.18,
    "gardien_prise_de_balle": 0.16,
    "gardien_placement": 0.16,
    "gardien_jeu_au_pied": 0.12,
    "gardien_vitesse": 0.08,
    "gardien_sorties": 0.08,
}

PPI_REF = 55.0
PERFORMANCE_EXPONENT = 2.35
MIN_VALUATION = 50_000

TRAIT_PREMIUMS = {
    "Tir en finesse": 0.040,
    "Sprinteur": 0.035,
    "Le Mur": 0.050,
    "Expert Cardio": 0.030,
    "Réflexes éclair": 0.060,
    "Jeu aérien": 0.025,
    "Métronome": 0.030,
    "Créateur": 0.040,
    "Renard des surfaces": 0.050,
}

LEADERSHIP_PREMIUM = 0.040
CALME_PREMIUM = 0.020
SATISFACTION_SENSITIVITY = 0.080
CHEM_POS_RATE = 0.012
CHEM_NEG_RATE = 0.020
FORM_SENSITIVITY = 0.080
WAGE_TO_VALUE_RATIO = 0.10
MAX_INJURY_PENALTY = 0.55

GRAVITY_PENALTY = {
    "Légère": 0.015,
    "Modérée": 0.045,
    "Grave": 0.120,
}


#
# Helpers
#


def _euro(value: float) -> int:
    return int(round(value))


def _ledger(
    category: str,
    parameter: str,
    impact: int,
    rule: str,
) -> dict:
    return {
        "category": category,
        "parameter": parameter,
        "impact_euros": impact,
        "calculation_rule": rule,
    }


def resolve_position(payload: dict) -> str:
    """
        Map club role / FC27 label to a TPE position key.
    """
    if payload.get("gardien"):
        return "Goalkeeper"
    poste = (payload.get("poste_fc27") or "").lower()
    groupe = payload.get("groupe_poste") or ""
    if any(k in poste for k in ("st", "cf", "bu", "attaquant")):
        return "Striker"
    if any(k in poste for k in ("lw", "rw", "lm", "rm", "ailier")):
        return "Winger"
    if any(k in poste for k in ("cam", "mo", "meneur")):
        return "Attacking Midfielder"
    if any(k in poste for k in ("cdm", "mdc", "récup")):
        return "Defensive Midfielder"
    if any(k in poste for k in ("lb", "rb", "latéral", "lateral")):
        return "Full-Back"
    if any(k in poste for k in ("cb", "dc", "défenseur c")):
        return "Center-Back"
    if any(k in poste for k in ("cm", "mc")):
        return "Central Midfielder"
    if groupe == "Attaquant":
        return "Striker"
    if groupe == "Milieu":
        return "Central Midfielder"
    if groupe == "Défenseur":
        return "Center-Back"
    return "Central Midfielder"


def age_multiplier(age: int) -> tuple[float, str]:
    """
        Actuarial age curve : prospect premium, peak, then decay.
    """
    if age <= 17:
        return 1.28, "Prospect 17 ans : plafond de revente ×1,28"
    if age <= 19:
        return 1.22, f"Prospect {age} ans : appréciation ×1,22"
    if age <= 22:
        return 1.15, f"Développement {age} ans : ×1,15"
    if age == 23:
        return 1.08, "Pré-pic 23 ans : ×1,08"
    if age <= 28:
        return 1.12, f"Pic de carrière {age} ans : ×1,12"
    if age == 29:
        return 0.97, "Sortie de pic 29 ans : ×0,97"
    if age == 30:
        return 0.88, "Dépréciation 30 ans : ×0,88"
    if age == 31:
        return 0.78, "Dépréciation 31 ans : ×0,78"
    if age == 32:
        return 0.68, "Dépréciation 32 ans : ×0,68"
    decay = max(0.35, 0.60 * (0.88 ** (age - 33)))
    return decay, (
        f"Dépréciation non linéaire {age} ans : "
        f"0,60 × 0,88^({age}-33) = {decay:.3f}"
    )


def _cluster_score(
    payload: dict,
    cluster: str,
    position: str,
) -> float:
    attrs = ATTRIBUTES[cluster]
    boosts = SUB_SKILL_BOOST.get(position, {})
    weighted = 0.0
    total_w = 0.0
    for key in attrs:
        raw = payload.get(key)
        if raw is None:
            continue
        w = boosts.get(key, 1.0)
        weighted += float(raw) * w
        total_w += w
    if total_w <= 0:
        return float(payload.get("note_" + cluster) or 50)
    return weighted / total_w


def _gk_score(payload: dict) -> float:
    weighted = 0.0
    total_w = 0.0
    for key, w in GK_SUB_WEIGHTS.items():
        raw = payload.get(key)
        if raw is None:
            continue
        weighted += float(raw) * w
        total_w += w
    if total_w <= 0:
        return 50.0
    return weighted / total_w


def compute_ppi(payload: dict, position: str) -> tuple[float, list[dict]]:
    """
        PPI = Σ (w_i × score_i) on a 0–100 scale.
    """
    weights = CLUSTER_WEIGHTS[position]
    parts: list[dict] = []
    ppi = 0.0
    for cluster, weight in weights.items():
        if cluster == "_gk":
            score = _gk_score(payload)
            label = "Gardien (métriques spécifiques)"
        else:
            score = _cluster_score(payload, cluster, position)
            label = cluster.capitalize()
        contrib = weight * score
        ppi += contrib
        parts.append({
            "cluster": label,
            "score": round(score, 2),
            "weight": weight,
            "contribution": round(contrib, 2),
        })
    return round(ppi, 2), parts


def _season_form_rating(matches: list[dict]) -> float:
    """
        Proxy Opta/SofaScore when live ratings are absent.
    """
    if not matches:
        return 65.0
    scores = []
    for match in matches:
        minutes = match.get("minutes") or 0
        goals = match.get("goals") or 0
        assists = match.get("assists") or 0
        accuracy = match.get("pass_accuracy") or 65
        duels = match.get("duels_won") or 0
        score = (
            accuracy * 0.35
            + min(40, goals * 18 + assists * 12)
            + min(20, minutes / 90 * 20)
            + min(15, duels * 1.2)
        )
        scores.append(min(95.0, max(40.0, score)))
    return round(sum(scores) / len(scores), 1)


def _injury_days(injury: dict) -> int:
    try:
        start = date.fromisoformat(injury["debut"])
        end_raw = injury.get("retour_effectif") or injury.get(
            "retour_prevu",
        )
        if not end_raw:
            return 14
        end = date.fromisoformat(end_raw)
        return max(0, (end - start).days)
    except (KeyError, TypeError, ValueError):
        return 14


#
# Valuation engine
#


def value_player(payload: dict, matches: list[dict] | None = None) -> dict:
    """
        Execute Tiers 1–4 and build an auditable euro ledger.
    """
    matches = matches or []
    ledger: list[dict] = []
    position = resolve_position(payload)
    pos_label = POSITION_LABELS[position]
    base_mult = POSITION_BASE_MULT[position]
    v_base = _euro(V_BASE_LIGUE2 * base_mult)

    ledger.append(_ledger(
        "Baseline ligue",
        (
            f"Ancre Ligue 2 = {V_BASE_LIGUE2:,} € × "
            f"mult. {pos_label} ({base_mult})"
        ).replace(",", " "),
        v_base,
        (
            f"V_base = {V_BASE_LIGUE2} × {base_mult} "
            f"= {v_base} €"
        ),
    ))

    # --- Tier 1 : PPI & performance ---
    ppi, parts = compute_ppi(payload, position)
    for part in parts:
        ledger.append(_ledger(
            "Positional Skill",
            (
                f"{part['cluster']} = {part['score']}/100 "
                f"(w={part['weight']:.0%})"
            ),
            0,
            (
                f"PPI += {part['weight']} × {part['score']} "
                f"= {part['contribution']} (audit, 0 € direct)"
            ),
        ))

    ratio = (ppi / PPI_REF) ** PERFORMANCE_EXPONENT
    v_performance = _euro(v_base * (ratio - 1))
    v1 = max(MIN_VALUATION, v_base + v_performance)
    # Si le plancher joue, l’écart est reporté dans le ledger.
    floor_pad = v1 - (v_base + v_performance)
    ledger.append(_ledger(
        "Positional Skill",
        f"PPI = {ppi}/100 (réf. ligue {PPI_REF})",
        v_performance + floor_pad,
        (
            f"V_perf = V_base × ((PPI/{PPI_REF})"
            f"^{PERFORMANCE_EXPONENT} − 1) = {v_performance} €"
            + (
                f" ; plancher {MIN_VALUATION} € (+{floor_pad})"
                if floor_pad
                else ""
            )
        ),
    ))

    # --- Tier 2 : age curve ---
    age = int(payload.get("age") or 25)
    age_mult, age_rule = age_multiplier(age)
    v2 = max(MIN_VALUATION, _euro(v1 * age_mult))
    v_age_delta = v2 - v1
    ledger.append(_ledger(
        "Age Curve",
        f"Âge = {age} ans → multiplicateur {age_mult}",
        v_age_delta,
        age_rule + f" ; Δ = V2 − V1 = {v_age_delta} €",
    ))

    # --- Tier 3 : intangibles ---
    running = float(v2)
    specialties = payload.get("specialite_tags") or []
    for trait in specialties:
        rate = TRAIT_PREMIUMS.get(trait)
        if rate is None:
            continue
        impact = _euro(v2 * rate)
        running += impact
        ledger.append(_ledger(
            "Trait / Spécialité",
            f"Spécialité « {trait} »",
            impact,
            f"Prime = {rate:.1%} × V_âge ({v2} €)",
        ))

    tags = payload.get("personnalite_tags") or []
    if "Meneur" in tags:
        impact = _euro(v2 * LEADERSHIP_PREMIUM)
        running += impact
        ledger.append(_ledger(
            "Leadership",
            "Personnalité = Meneur",
            impact,
            f"Prime leadership = {LEADERSHIP_PREMIUM:.0%} × V_âge",
        ))
    if "Calme" in tags:
        impact = _euro(v2 * CALME_PREMIUM)
        running += impact
        ledger.append(_ledger(
            "Fiabilité",
            "Personnalité = Calme",
            impact,
            f"Prime calme = {CALME_PREMIUM:.0%} × V_âge",
        ))

    satisfaction = int(payload.get("satisfaction_score") or 50)
    sat_factor = (satisfaction - 50) / 100 * SATISFACTION_SENSITIVITY
    sat_impact = _euro(v2 * sat_factor)
    running += sat_impact
    ledger.append(_ledger(
        "Satisfaction",
        f"Satisfaction = {satisfaction}/100",
        sat_impact,
        (
            f"Δ = (({satisfaction}−50)/100) × "
            f"{SATISFACTION_SENSITIVITY:.0%} × V_âge"
        ),
    ))

    for relation in payload.get("relations") or []:
        polarity = relation.get("polarite")
        intensity = float(relation.get("intensite") or 0)
        name = relation.get("target_name") or "coéquipier"
        if polarity == "POSITIF":
            rate = CHEM_POS_RATE * (intensity / 100)
            impact = _euro(v2 * rate)
            label = "Chemistry"
            rule = (
                f"Affinité + : {CHEM_POS_RATE:.1%} × "
                f"intensité {intensity:.0f}/100 × V_âge"
            )
        elif polarity == "NEGATIF":
            rate = CHEM_NEG_RATE * (intensity / 100)
            impact = -_euro(v2 * rate)
            label = "Chemistry"
            rule = (
                f"Friction − : {CHEM_NEG_RATE:.1%} × "
                f"intensité {intensity:.0f}/100 × V_âge"
            )
        else:
            continue
        running += impact
        ledger.append(_ledger(
            label,
            f"{polarity} vs {name} (intensité {intensity:.0f})",
            impact,
            rule,
        ))

    form = _season_form_rating(matches)
    form_factor = (form - 65) / 100 * FORM_SENSITIVITY
    form_impact = _euro(v2 * form_factor)
    running += form_impact
    ledger.append(_ledger(
        "Forme saison (proxy Opta)",
        f"Indice de forme matchs = {form}/100",
        form_impact,
        (
            f"Δ = (({form}−65)/100) × "
            f"{FORM_SENSITIVITY:.0%} × V_âge"
        ),
    ))

    v3_raw = _euro(running)
    v3 = max(MIN_VALUATION, v3_raw)
    if v3 != v3_raw:
        ledger.append(_ledger(
            "Plancher",
            f"Valeur post-intangibles < {MIN_VALUATION} €",
            v3 - v3_raw,
            f"Plancher club appliqué : {MIN_VALUATION} €",
        ))

    # --- Tier 4 : durability discount ---
    penalty = 0.0
    injuries = payload.get("injuries") or []
    for injury in injuries:
        gravite = injury.get("gravite") or "Légère"
        base_p = GRAVITY_PENALTY.get(gravite, 0.03)
        days = _injury_days(injury)
        day_p = min(0.08, days / 365 * 0.15)
        add = base_p + day_p
        penalty += add
        ledger.append(_ledger(
            "Durability Risk",
            (
                f"{injury.get('type_blessure', 'Blessure')} · "
                f"{gravite} · {days} j absents"
            ),
            0,
            (
                f"Pénalité cumulative +{add:.1%} "
                f"(gravité {base_p:.1%} + durée {day_p:.1%})"
            ),
        ))

    status = payload.get("statut_sante") or "Disponible"
    if status == "Blessé":
        penalty += 0.12
        ledger.append(_ledger(
            "Durability Risk",
            "Statut santé = Blessé",
            0,
            "Surcote risque immédiat +12 %",
        ))
    elif status == "Réathlétisation":
        penalty += 0.07
        ledger.append(_ledger(
            "Durability Risk",
            "Statut santé = Réathlétisation",
            0,
            "Surcote reprise +7 %",
        ))
    elif status == "Vigilance":
        penalty += 0.03
        ledger.append(_ledger(
            "Durability Risk",
            "Statut santé = Vigilance",
            0,
            "Surcote vigilance +3 %",
        ))

    health = int(payload.get("sante_score") or 100)
    if health < 70:
        health_p = (70 - health) / 100 * 0.25
        penalty += health_p
        ledger.append(_ledger(
            "Durability Risk",
            f"Indicateur santé = {health}/100",
            0,
            (
                f"Décote santé = ((70−{health})/100) × 0,25 "
                f"= {health_p:.1%}"
            ),
        ))

    capped = min(MAX_INJURY_PENALTY, penalty)
    d_injury = 1.0 - capped
    v_final = max(MIN_VALUATION, _euro(v3 * d_injury))
    injury_impact = v_final - v3
    ledger.append(_ledger(
        "Durability Risk",
        (
            f"D_injury = 1 − min({MAX_INJURY_PENALTY:.0%}, "
            f"{penalty:.1%}) = {d_injury:.3f}"
        ),
        injury_impact,
        (
            f"V_final = V_intangibles × D_injury = "
            f"{v3} × {d_injury:.3f} = {v_final} €"
        ),
    ))

    wage_annual = _euro(v_final * WAGE_TO_VALUE_RATIO)
    wage_monthly = _euro(wage_annual / 12)
    ledger.append(_ledger(
        "Salaire recommandé",
        (
            f"Plafond annuel = {WAGE_TO_VALUE_RATIO:.0%} "
            f"× valeur finale"
        ),
        wage_annual,
        (
            f"Salaire annuel {wage_annual} € · "
            f"mensuel {wage_monthly} €"
        ),
    ))

    return {
        "player_id": payload["joueur_id"],
        "player_name": payload["nom"],
        "position_key": position,
        "position_label": pos_label,
        "base_league_value": v_base,
        "positional_performance_score": ppi,
        "value_after_performance": v1,
        "value_after_age": v2,
        "value_after_intangibles": v3,
        "injury_discount_factor": round(d_injury, 4),
        "final_valuation": v_final,
        "recommended_wage_ceiling": {
            "monthly_euros": wage_monthly,
            "annual_euros": wage_annual,
            "wage_to_value_ratio": WAGE_TO_VALUE_RATIO,
        },
        "explainability_ledger": ledger,
        "formula_version": FORMULA_VERSION,
    }


def market_value(payload: dict) -> int:
    """Valeur de marché estimée (euros), avec la forme des matchs simulés."""
    return value_player(payload, simulation.matches(payload))["final_valuation"]

