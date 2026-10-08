# Données de simulation DFCO

90 joueurs : 30 joueurs de l’effectif professionnel masculin publié par le DFCO et 60 prospects fictifs. Source consultée le 8 octobre 2026 : https://www.dfco.fr/effectifs/effectif-pro/
Le périmètre exclut réserve, jeunes et équipe féminine. L’effectif correspond à la page publiée, sans garantie sur l’inscription en compétition ou les prêts. Le contenu de la page peut évoluer.

## Provenance

Les noms et groupes de poste des joueurs DFCO sont les seuls faits publics repris. Toutes les autres données sont simulées : naissance, âge, poids, taille, pied fort, notes, personnalité, spécialités, langues, blessures, santé, satisfaction et relations. Les dates de naissance fictives ne doivent pas être utilisées comme biographies réelles. Les prospects et leurs clubs sont entièrement fictifs.
Les tags n’ont pas été déduits de la vie réelle des joueurs. Ce jeu ne constitue pas un fichier médical ou une évaluation sportive réelle.

## Utilisation

- `joueurs.csv` : une ligne par joueur, tous les attributs demandés et résumé santé.
- `blessures.csv` : 117 événements, liés par joueur_id. Plusieurs événements possibles par joueur.
- `relations.csv` : 270 relations dirigées, liées par joueur_source_id et joueur_cible_id.
- `dictionnaire.csv` : description de chaque colonne.
- `dfco_simulation.json` : même jeu de données avec nombres, booléens, listes et valeurs null natives.

CSV en UTF-8 avec BOM, séparateur point-virgule, décimales avec point. Dans Excel : Données → À partir d’un fichier texte/CSV ; choisir UTF-8 et point-virgule. Les listes CSV utilisent `|`. Un champ vide correspond à null ou non applicable, jamais à une note zéro. Les dates suivent YYYY-MM-DD.

Notes techniques : entiers 1–99 sur une échelle de 100, profils générés selon quatre groupes de postes. Les six notes globales sont des moyennes simples, pas des notes EA Sports officielles. Les attributs gardien sont vides pour les joueurs de champ. Les spécialités sont des tags descriptifs indépendants des notes ; votre simulateur définit leurs bonus éventuels.

Relations : A → B n’implique pas B → A. Un joueur possède deux relations positives et une négative avec son équipe/club fictif. L’affinité sociale peut avoir un effet performance nul tout en restant positive. Aucune relation neutre. Absence de relation signifie non renseignée. Le score général d’intégration dans l’équipe est une variable distincte des affinités individuelles. Les effets de performance sont des paramètres fictifs, sans règle de cumul imposée.

Santé : VERT = disponible ; ORANGE = vigilance ou réathlétisation ; ROUGE = blessé. Les blessures actives ont un retour prévu futur et aucun retour effectif. Fatigue et satisfaction vont de 0 à 100. Fatigue élevée = plus fatigué ; satisfaction élevée = plus satisfait. Le score santé est un indicateur de scénario, pas un seuil médical.

## Régénération

Depuis la racine du projet : `python generate_dataset.py`. Graine fixe 20261008. La génération contrôle les effectifs, les identifiants, les bornes, les liens, les statuts santé et la relecture des exports. Les données sont un instantané : toute modification d’une note nécessite le recalcul de sa moyenne, et tout changement de blessure nécessite la mise à jour du résumé santé.
