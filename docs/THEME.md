# Thème Easyfoot

Direction : interface « data app » épurée (inspiration Snowflake) avec la lecture rapide des jeux
de gestion foot (FM 26 pour les notes colorées et le terrain, FC 26 pour la carte de notes).

## Couleurs

- **Radix Colors** (MIT) vendorisées dans `frontend/src/theme/radix/` : `slate` (neutres),
  `grass` / `amber` / `red` / `blue` (statuts). Pas de dépendance npm.
- **Marque** : `--brand-1…12` générée autour de `#d40125` par `frontend/scripts/generate-brand-scale.py`
  (luminosités Radix `red`, teinte DFCO ; pas 9 = `#d40125`, pas 11 = texte AA).
- **Tokens sémantiques** (`tokens.css`) : `--ef-bg`, `--ef-surface`, `--ef-text`, `--ef-accent`,
  `--ef-success|warn|danger|info(-soft|-text)`… Les composants n'utilisent que ces tokens.
- **PrimeNG** : `src/app/theme/easyfoot.preset.ts` mappe `primary` et `surface` sur ces variables.
- Sombre : `.app-dark` sur `<html>` ; Radix bascule seul, PrimeNG inverse les paliers `surface`.

| Usage | Light | Dark |
|-------|-------|------|
| Fond de page | `slate-2` | `slate-1` |
| Surface (panneaux) | blanc | `slate-2` |
| Texte / secondaire | `slate-12` / `slate-11` | idem (échelle dark) |
| Accent (CTA, nav active, onze type) | `brand-9` | `brand-9` |

## Lecture des notes (façon FM)

`ef-rating` colore une note 0-100 : ≥ 80 et ≥ 70 vert, 60-69 neutre, 50-59 ambre, < 50 rouge.

## Typographie

Manrope (texte) et Barlow Condensed (chiffres, noms de joueurs), auto-hébergées dans
`frontend/public/fonts` (SIL OFL) : aucun appel à Google Fonts.

## Logos

`logos/` reste la source. Copies servies dans `frontend/public/brand/` :
`easyfoot.svg` (haut à gauche, thème clair), `easyfoot-dark.svg` (texte éclairci pour le sombre),
`favicon.svg` (onglet, issu de `Logo_opti.svg`, s'adapte au thème du navigateur).
