# Jeu de données DFCO et prospects — FC 27

Instantané au 8 octobre 2026 : 90 joueurs, dont 30 joueurs de l’effectif professionnel masculin DFCO et 60 prospects désormais issus de fiches de joueurs réels FC 27.

## Ce qui a changé

24 DFCO et 60 prospects possèdent les 29 sous-attributs, les six notes globales, la note générale, le poste FC 27 et le pied fort affichés par FUTWIZ. Cartes de base Bronze/Silver, sans évolution ni bonus de chimie. Les valeurs des six notes globales sont importées directement : elles ne sont pas les moyennes simples des sous-attributs.

Les 6 DFCO absents du filtre du site conservent leurs attributs simulés : Enzo Ketterle, Tom Meynadier, Brayan Djadja, Hatem Mimoune, Ange Lago, Abd-Elmajid Djae. Cette absence du filtre ne prouve pas une absence dans toute la base FC 27. L’effectif officiel de 30 joueurs est conservé.

Les 60 anciens prospects fictifs sont remplacés dans l’ordre de leurs IDs par des joueurs réels de FUTWIZ. Sélection : 60 premières fiches masculines hors DFCO du filtre rating_min=60&rating_max=68, tri rating décroissant, pages 1–2 ; les 60 retenus sont notés 68. Aucun critère d’âge ou de disponibilité de transfert vérifié. La sélection sert à la simulation et ne représente pas une recommandation de recrutement ni une disponibilité de transfert. Le nom du club des prospects est laissé vide, car il n’a pas été récupéré sur les fiches consultées.

## Données encore simulées

Âge, naissance, poids, taille, langues, personnalité, spécialités, fatigue, santé, blessures, satisfaction et relations restent simulés. Des fiches FUTWIZ DFCO affichent âge 0, poids 0 et taille / : ces valeurs manquantes n’ont pas remplacé la biométrie simulée. La biométrie des prospects n’a pas été importée. Les mesures et naissances du scénario ne constituent pas des biographies réelles.

Les attributs gardien importés sont DIV, HAN, KIC, REF, SPD et POS. SPD est stocké dans gardien_vitesse. Les sorties restent simulées, car FUTWIZ ne fournit pas cet attribut. Le placement offensif et le placement gardien sont distincts. Les 29 attributs de champ des gardiens sont aussi importés, et leurs six notes de champ utilisent la section PAC/SHO/PAS/DRI/DEF/PHY, pas les six valeurs de la carte gardien.

Les PlayStyles relevés sont conservés séparément, avec leurs libellés anglais, dans playstyles_fc27_observes. Une liste vide signifie aucun libellé relevé. Les specialite_tags français restent des tags du scénario, jamais une traduction supposée d’un PlayStyle officiel.

Les groupes de postes officiels DFCO sont conservés. poste_fc27 et groupe_poste_fc27 décrivent séparément le jeu : par exemple Ylan Aka est classé Attaquant par le DFCO et CDM dans FC 27.

## Fichiers

- joueurs.csv : 90 profils avec statut_import_fc27 et colonnes de provenance.
- blessures.csv : 117 événements fictifs, inchangés.
- relations.csv : 270 relations fictives dirigées ; contexte scenario_recrutement.
- couverture_fc27.csv : bilan individuel des imports et des absences.
- provenance.csv : origine par joueur et colonne, avec URL lorsque sourcée.
- dictionnaire.csv : définition des colonnes.
- dfco_simulation.json : mêmes données typées, avec metadata et provenance_champs.

Les identifiants des 90 profils restent stables pour conserver les liens des blessures et affinités. Les relations sont désormais des liens de scénario de recrutement ; elles ne prouvent ni relation personnelle réelle ni club commun. Aucun lien neutre. Un effet performance nul peut correspondre à une affinité sociale positive.

CSV : UTF-8 avec BOM, séparateur point-virgule, listes séparées par |, décimales avec point. Dans Excel : Données → À partir d’un fichier texte/CSV, choisir UTF-8 et point-virgule. Vide = null/non renseigné/non applicable, pas zéro. Dates YYYY-MM-DD. Santé VERT disponible, ORANGE vigilance/réathlétisation, ROUGE blessé ; indicateurs et historique sont entièrement fictifs.

## Sources et reproductibilité

Identités et groupes DFCO : https://www.dfco.fr/effectifs/effectif-pro/
Liste FC 27 DFCO : https://www.futwiz.com/fc27/players?teams[]=110569
Fiches individuelles : fc27_url dans joueurs.csv et URLs dans provenance.csv.

L’instantané relevé depuis les pages visibles est conservé dans sources/fc27_futwiz.json à la racine du projet. Son contrôle d’intégrité a été comparé à la collecte navigateur (24 + 60 fiches). `python update_fc27.py` réapplique cet instantané, sans accès réseau. `python generate_dataset.py` régénère le scénario avec la graine 20261008 puis applique le même instantané FC 27. Ces commandes ne rafraîchissent pas le site.

La première archive simulée est conservée dans data/archives/dfco_dataset_simulation_initiale.zip. Le ZIP principal contient uniquement la version mise à jour et sa documentation.
