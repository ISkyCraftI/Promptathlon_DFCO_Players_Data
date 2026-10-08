# Contrat de comparaison

API MVC indépendante sous `/api/development`. Le suivi de recrutement peut
enregistrer un prospect dans ce module puis conserver l'identifiant retourné ;
aucun workflow du module prospects n'est modifié.

- `GET /profiles/` : collectif professionnel + formation + prospects comparables.
- `POST /profiles/` : créer un profil de formation ou un prospect.
- `PUT /profiles/{id}` : compléter un profil créé/importé dans ce module. Les
  joueurs du collectif sont lus depuis la feature players et ne sont pas modifiés.
- `POST /compare/` : comparaison avec sélection automatique ou explicite.

Exemple de saisie partielle :

```json
{
  "name": "Profil de démonstration",
  "category": "youth",
  "age": 17,
  "position": "CM",
  "foot": "Droit",
  "ratings": {"passe": 62, "dribble": 65, "physique": null},
  "observations": 2,
  "minutes": 90,
  "assessed_on": "2026-10-08",
  "note": "Deux observations selon la même grille de notation."
}
```

`category` accepte `youth` ou `prospect`. `position` accepte GK, CB, LB, RB, CDM,
CM, CAM, LM, RM, LW, RW, ST. Les notes sont des entiers de 0 à 100. Les qualités
absentes deviennent `null`. Pour les joueurs de champ : vitesse, frappe, passe,
dribble, defense, physique. Pour GK : plongeon, prise, jeu_pied, reflexes, vitesse,
placement. Mélanger les deux grilles est rejeté. Taille, poids, pied, minutes et
date sont facultatifs. Une date future est rejetée.

Exemple de comparaison :

```json
{
  "target_id": "YOUTH_001",
  "reference_category": "pro",
  "strict_position": false,
  "same_foot": false,
  "min_age": null,
  "max_age": null,
  "reference_ids": null
}
```

`reference_category` accepte pro, youth, prospect. `reference_ids: null` propose
jusqu'à cinq références ; une liste non vide sélectionne explicitement des profils
éligibles. Les doublons, auto-comparaisons et références incompatibles sont rejetés.
Les critères ne sont jamais élargis silencieusement.

La réponse contient les références proposées, tous les profils éligibles, les
valeurs comparées, écarts, poids au poste, nombre de références par qualité,
priorités, points d'appui, données manquantes et méthode. Les valeurs absentes
ne participent pas aux moyennes. Le niveau relatif requiert au moins quatre
qualités comparables et une moyenne de référence strictement positive.

Poids, dans l'ordre des six qualités : défenseurs [1, .4, 1, .6, 1.8, 1.4],
milieux [.8, .8, 1.7, 1.4, .8, 1], attaquants [1.3, 1.8, .8, 1.4, .3, 1],
gardiens [1.2, 1.2, 1, 1.4, .6, 1.6]. Ce sont des règles de démonstration
à calibrer avec le staff, sans validation prédictive. Les catégories de lecture
du niveau relatif utilisent les seuils 80 % et 95 %.

Les fixtures sont signalées par `demo: true`. Les profils créés par formulaire ont
`demo: false`, mais toute comparaison comportant une référence de démonstration
reste indiquée comme telle. L'observation et la saisie du staff ne sont pas des
mesures capteur. Seul le dernier état du profil est conservé : aucune tendance
temporelle ni prédiction de carrière n'est calculée. Pour intégrer de nouvelles
données, utiliser le même protocole de notation ; des notes hétérogènes ne sont
pas directement comparables.

Une erreur métier conserve le contrat `detail.user_safe_title`,
`detail.user_safe_description`, `detail.dev`.
