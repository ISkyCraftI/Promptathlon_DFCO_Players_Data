"""Calculs de correspondance entre joueurs et profils (recrutement, comparaison).

- `weighted_fit` : note d'adéquation 0-100 à un profil pondéré (moyenne pondérée des sous-attributs).
- `similarity`   : similarité de style (cosinus sur les attributs centrés), 0-100.
- `gaps`         : écarts attribut par attribut, triés par impact (écart × importance au poste).
"""
import math

from app.shared.football.catalog import FIELD_ATTRIBUTES, GROUP_OF, LABELS, ROLE_WEIGHTS, attributes_for


def value(p: dict, attribute: str) -> float | None:
    v = p.get(attribute)
    return float(v) if isinstance(v, (int, float)) else None


def weighted_fit(p: dict, weights: dict[str, float]) -> dict:
    total, weight_sum, contributions = 0.0, 0.0, []
    for attribute, weight in weights.items():
        v = value(p, attribute)
        if weight <= 0 or v is None:
            continue
        total += v * weight
        weight_sum += weight
        contributions.append(dict(key=attribute, label=LABELS.get(attribute, attribute), value=v, weight=weight))
    score = round(total / weight_sum, 1) if weight_sum else 0.0
    contributions.sort(key=lambda c: (c["value"] - score) * c["weight"], reverse=True)
    return dict(score=score, strengths=contributions[:3], weaknesses=list(reversed(contributions[-2:])) if len(contributions) > 3 else [])


def _vector(p: dict, attributes: list[str]) -> list[float]:
    raw = [value(p, a) or 0.0 for a in attributes]
    mean = sum(raw) / len(raw)
    return [v - mean for v in raw]


def similarity(a: dict, b: dict) -> float:
    attributes = attributes_for(a["gardien"] and b["gardien"])
    va, vb = _vector(a, attributes), _vector(b, attributes)
    dot = sum(x * y for x, y in zip(va, vb))
    norm = math.sqrt(sum(x * x for x in va)) * math.sqrt(sum(y * y for y in vb))
    return round(max(0.0, dot / norm) * 100, 1) if norm else 0.0


def gaps(subject: dict, reference: dict, role: str) -> list[dict]:
    weights = ROLE_WEIGHTS.get(role, {})
    attributes = attributes_for(subject["gardien"]) if subject["gardien"] else FIELD_ATTRIBUTES
    out = []
    for attribute in attributes:
        a, b = value(subject, attribute), value(reference, attribute)
        if a is None or b is None:
            continue
        importance = weights.get(attribute, 0)
        out.append(dict(key=attribute, label=LABELS[attribute], group=GROUP_OF[attribute], subject=a, reference=b,
                        gap=round(b - a, 1), importance=importance, impact=round((b - a) * (1 + importance), 1)))
    return out
