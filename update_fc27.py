"""Applique l'instantané FUTWIZ vérifié aux exports, sans accès réseau."""
import csv
import json
import shutil
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'data'
SOURCE_PATH = ROOT / 'sources' / 'fc27_futwiz.json'
GROUP_MAP = {'GK': 'Gardien', 'CB': 'Défenseur', 'LB': 'Défenseur', 'RB': 'Défenseur',
             'CDM': 'Milieu', 'CM': 'Milieu', 'CAM': 'Milieu', 'LM': 'Milieu', 'RM': 'Milieu',
             'LW': 'Attaquant', 'RW': 'Attaquant', 'ST': 'Attaquant'}
GK_KEYS = ['gardien_plongeon', 'gardien_prise_de_balle', 'gardien_jeu_au_pied',
           'gardien_reflexes', 'gardien_vitesse', 'gardien_placement']
EXTRA = {
    'nom_fc27': 'Nom affiché par FUTWIZ, distinct de la graphie officielle DFCO.',
    'note_generale_fc27': 'Note générale FC 27 de la carte de base ; vide si joueur absent du filtre DFCO.',
    'poste_fc27': 'Poste principal de la carte FC 27, codes anglais (CB = défenseur central, ST = avant-centre).',
    'groupe_poste_fc27': 'Groupe dérivé du poste FC 27. Peut différer du groupe officiel DFCO.',
    'fc27_url': 'URL exacte de la fiche FUTWIZ consultée le 08/10/2026.',
    'fc27_id_fiche': 'Identifiant de fiche FUTWIZ, pas identifiant EA du joueur.',
    'fc27_version_carte': 'Bronze ou Silver, carte de base observée. Pas de carte spéciale ou bonus de chimie.',
    'playstyles_fc27_observes': 'Libellés anglais affichés et relevés. Liste vide = aucun libellé relevé, pas preuve d’absence de PlayStyles.',
    'gardien_vitesse': 'SPD gardien FC 27, différent de PAC joueur de champ. Vide si gardien non couvert ou joueur de champ.',
    'statut_import_fc27': 'IMPORTE ou ABSENT_DU_FILTRE_DFCO. Aucune donnée FC 27 inventée pour les absents.',
    'provenance_biometrie': 'simule : âge, naissance, poids et taille conservés du scénario initial.',
    'provenance_pied_fort': 'fc27_futwiz ou simule.',
    'provenance_attributs': 'fc27_futwiz pour les 29 attributs importés, sinon simule.',
    'provenance_notes_groupes': 'fc27_futwiz : notes globales du site ; moyenne_simulee : moyennes du scénario initial.',
    'provenance_scenario': 'simule pour santé, langues, satisfaction, personnalité, spécialités et relations.',
}

def normalize(name):
    return ''.join(c for c in unicodedata.normalize('NFKD', name).lower() if not unicodedata.combining(c)).strip()

def write_csv(path, rows):
    keys = list(rows[0])
    assert all(set(r) == set(keys) for r in rows)
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys, delimiter=';')
        w.writeheader()
        for row in rows:
            w.writerow({k: '|'.join(v) if isinstance(v, list) else int(v) if isinstance(v, bool) else v for k, v in row.items()})

def main():
    source = json.loads(SOURCE_PATH.read_text(encoding='utf-8'))
    canonical = json.dumps([source['dfco'], source['prospects']], ensure_ascii=False, separators=(',', ':'))
    checksum = 2166136261
    for c in canonical:
        checksum = ((checksum ^ ord(c)) * 16777619) & 0xffffffff
    assert checksum == 3652478239, 'Instantané différent de la collecte navigateur vérifiée'
    assert len(source['dfco']) == 24 and len(source['prospects']) == 60
    dataset = json.loads((OUT / 'dfco_simulation.json').read_text(encoding='utf-8'))
    backup = OUT / 'archives' / 'dfco_dataset_simulation_initiale.zip'
    if not backup.exists():
        backup.parent.mkdir(exist_ok=True)
        if (OUT / 'dfco_dataset.zip').exists():
            shutil.copy2(OUT / 'dfco_dataset.zip', backup)
        else:
            with zipfile.ZipFile(backup, 'w', zipfile.ZIP_DEFLATED) as z:
                for name in ['joueurs.csv', 'blessures.csv', 'relations.csv', 'dictionnaire.csv', 'dfco_simulation.json', 'README.md']:
                    z.write(OUT / name, arcname=name)
    players = dataset['joueurs']
    assert len(players) == 90
    original_scenario = {p['joueur_id']: {k: p[k] for k in ['statut_sante', 'satisfaction_score', 'langues_parlees', 'affinites_positives_ids', 'affinites_negatives_ids']} for p in players}
    lookup = {normalize(row[1]): row for row in source['dfco']}
    lookup['brandon ndezi'] = lookup['brandon nsimba ndezi']
    provenance, coverage = [], []
    imported = set()
    for p in players:
        row = lookup.get(normalize(p['nom'])) if p['type_joueur'] == 'DFCO' else source['prospects'][int(p['joueur_id'].split('_')[1]) - 1]
        p.update(nom_fc27=None, note_generale_fc27=None, poste_fc27=None, groupe_poste_fc27=None,
                 fc27_url=None, fc27_id_fiche=None, fc27_version_carte=None, playstyles_fc27_observes=[],
                 gardien_vitesse=None, statut_import_fc27='ABSENT_DU_FILTRE_DFCO',
                 provenance_biometrie='simule', provenance_pied_fort='simule', provenance_attributs='simule',
                 provenance_notes_groupes='moyenne_simulee', provenance_scenario='simule')
        fc_fields = set()
        if row:
            slug, name, overall, position, foot, stats, faces, gk, styles = row
            assert len(stats) == 29 and len(faces) == 6
            assert all(isinstance(v, int) and 1 <= v <= 99 for v in stats + faces)
            url = 'https://www.futwiz.com/fc27/player/' + slug
            p.update(nom_fc27=name, note_generale_fc27=overall, poste_fc27=position,
                     groupe_poste_fc27=GROUP_MAP[position], fc27_url=url, fc27_id_fiche=slug.split('/')[-1],
                     fc27_version_carte='Silver' if overall >= 65 else 'Bronze',
                     playstyles_fc27_observes=styles, statut_import_fc27='IMPORTE',
                     pied_fort={'left': 'Gauche', 'right': 'Droit'}[foot],
                     provenance_pied_fort='fc27_futwiz', provenance_attributs='fc27_futwiz',
                     provenance_notes_groupes='fc27_futwiz', provenance_autres_champs='mixte_voir_provenance.csv')
            for key, value in zip(source['attributs'], stats):
                p[key] = value
                fc_fields.add(key)
            for group, value in zip(source['notes_groupes'], faces):
                p['note_' + group] = value
                fc_fields.add('note_' + group)
            was_gk = p['gardien']
            p['gardien'] = position == 'GK'
            fc_fields.update(['gardien', 'pied_fort', 'nom_fc27', 'note_generale_fc27', 'poste_fc27', 'playstyles_fc27_observes'])
            for key in GK_KEYS:
                p[key] = None
            if p['gardien']:
                assert len(gk) == 6 and all(1 <= v <= 99 for v in gk)
                for key, value in zip(GK_KEYS, gk):
                    p[key] = value
                    fc_fields.add(key)
                # FUTWIZ fournit SPD, mais pas l’attribut « sorties » demandé initialement.
                p['gardien_sorties'] = p['gardien_sorties'] if was_gk else 52
            else:
                p['gardien_sorties'] = None
            if p['type_joueur'] == 'PROSPECT':
                p['nom'] = name
                p['club'] = None  # Nom du club non récupérable sur les fiches consultées.
                p['groupe_poste'] = GROUP_MAP[position]
                p['provenance_identite'] = 'fc27_futwiz'
                p['provenance_groupe_poste'] = 'derive_fc27'
                p['source_url'] = url
                p['source_consultee_le'] = source['date_consultation']
                fc_fields.add('nom')
                # Des tags de scénario cohérents avec le nouveau groupe, sans attribution réelle.
                p['specialite_tags'] = {'Gardien': ['Le Mur', 'Réflexes éclair'], 'Défenseur': ['Le Mur', 'Jeu aérien'], 'Milieu': ['Métronome', 'Créateur'], 'Attaquant': ['Tir en finesse', 'Sprinteur']}[p['groupe_poste']]
            imported.add(p['joueur_id'])
            assert [p[k] for k in source['attributs']] == stats
            assert [p['note_' + k] for k in source['notes_groupes']] == faces
        assert original_scenario[p['joueur_id']] == {k: p[k] for k in original_scenario[p['joueur_id']]}
        coverage.append(dict(joueur_id=p['joueur_id'], nom=p['nom'], type_joueur=p['type_joueur'],
            statut=p['statut_import_fc27'], note_generale_fc27=p['note_generale_fc27'], fc27_url=p['fc27_url'],
            motif='29 attributs, 6 notes globales et pied importés' if row else 'Fiche absente de la liste FUTWIZ DFCO ; valeurs simulées conservées'))
        for key, value in p.items():
            origin, url = 'simule', ''
            if key in fc_fields:
                origin, url = 'fc27_futwiz', p['fc27_url']
            elif key == 'groupe_poste_fc27' or (key == 'groupe_poste' and p['type_joueur'] == 'PROSPECT'):
                origin, url = ('derive_fc27', p['fc27_url']) if row else ('non_disponible', '')
            elif key in ['nom', 'club', 'groupe_poste'] and p['type_joueur'] == 'DFCO':
                origin, url = 'source_publique_dfco', p['source_url']
            elif key in ['joueur_id', 'type_joueur', 'date_reference'] or key.startswith(('provenance_', 'source_', 'fc27_')) or key == 'statut_import_fc27':
                origin = 'metadonnee'
            if value is None:
                origin = 'non_applicable' if key.startswith('gardien_') and not p['gardien'] else 'non_disponible'
            provenance.append(dict(joueur_id=p['joueur_id'], colonne=key, provenance=origin, source_url=url,
                                   date_reference=source['date_consultation']))
    assert len(imported) == 84
    assert len({p['fc27_id_fiche'] for p in players if p['statut_import_fc27'] == 'IMPORTE'}) == 84
    for r in dataset['relations']:
        r['contexte'] = 'scenario_recrutement'
    missing = [p['nom'] for p in players if p['statut_import_fc27'] != 'IMPORTE']
    dataset['metadata'].update(version='FC27_FUTWIZ_2026-10-08', source_fc27=source['source_effectif'],
        joueurs_fc27_importes=84, dfco_fc27_importes=24, prospects_fc27_importes=60,
        joueurs_dfco_sans_fiche_fc27=missing, selection_prospects=source['selection_prospects'],
        avertissement='Identités DFCO publiques. Notes, poste FC27 et pied de 84 joueurs importés de FUTWIZ. Biométrie et scénario (santé, blessures, langues, personnalité, spécialités, satisfaction, relations) simulés. 6 DFCO sans fiche dans la liste restent simulés.',
        notes_groupes='Valeurs FUTWIZ pour les joueurs couverts ; anciennes moyennes simulées pour les 6 non couverts. Jamais recalculer les notes FUTWIZ comme une moyenne simple.',
        relations='Scénario fictif dirigé, maintenu avec identifiants stables. Ne prouve aucune relation réelle ou appartenance au même club.')
    dataset['provenance_champs'] = provenance
    (OUT / 'dfco_simulation.json').write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding='utf-8')
    write_csv(OUT / 'joueurs.csv', players)
    write_csv(OUT / 'relations.csv', dataset['relations'])
    write_csv(OUT / 'provenance.csv', provenance)
    write_csv(OUT / 'couverture_fc27.csv', coverage)
    with (OUT / 'dictionnaire.csv').open(encoding='utf-8-sig', newline='') as f:
        dictionary = list(csv.DictReader(f, delimiter=';'))
    for d in dictionary:
        key = d['colonne']
        if d['table'] == 'joueurs':
            if key in EXTRA:
                d['description'] = EXTRA[key]
            elif key in source['attributs']:
                d['description'] = 'Attribut 1–99 : FUTWIZ FC 27 pour 84 joueurs ; simulé pour 6 DFCO non couverts. Voir provenance.csv.'
            elif key.startswith('note_') and key != 'note_generale_fc27':
                d['description'] = 'Note globale FUTWIZ FC 27 pour les joueurs couverts. Moyenne simple simulée pour les 6 autres ; voir provenance_notes_groupes.'
            elif key in GK_KEYS:
                d['description'] = 'Attribut FC 27 pour gardien couvert ; simulé pour gardien non couvert, vide pour joueur de champ.'
            elif key == 'gardien_sorties':
                d['description'] = 'Toujours simulé, car sorties n’est pas fourni par FUTWIZ. Vide pour joueur de champ.'
            elif key == 'nom':
                d['description'] = 'Nom DFCO officiel ou nom de joueur réel FUTWIZ pour les prospects.'
            elif key == 'club':
                d['description'] = 'DFCO ; vide pour les prospects (club non importé).'
            elif key == 'pied_fort':
                d['description'] = 'Droit/Gauche importé de FUTWIZ si couvert ; simulé sinon.'
            elif key == 'provenance_identite':
                d['description'] = 'source_publique DFCO ou fc27_futwiz pour prospects réels.'
            elif key == 'provenance_autres_champs':
                d['description'] = 'simule ou mixte_voir_provenance.csv. Utiliser provenance.csv pour connaître l’origine de chaque colonne.'
            elif key == 'source_url':
                d['description'] = 'Source identité DFCO officielle ou fiche FUTWIZ du prospect. Les notes FC 27 sont sourcées par fc27_url.'
    existing = {(d['table'], d['colonne']) for d in dictionary}
    for key, desc in EXTRA.items():
        if ('joueurs', key) not in existing:
            dictionary.append(dict(table='joueurs', colonne=key, type='liste' if key == 'playstyles_fc27_observes' else 'nombre' if key in ['note_generale_fc27', 'gardien_vitesse'] else 'texte', description=desc))
    if ('relations', 'contexte') not in existing:
        dictionary.append(dict(table='relations', colonne='contexte', type='texte', description='scenario_recrutement : relations fictives entre IDs, sans assertion de relation réelle ni de club commun.'))
    write_csv(OUT / 'dictionnaire.csv', dictionary)
    counts = Counter(p['statut_import_fc27'] for p in players)
    (OUT / 'README.md').write_text(f'''# Jeu de données DFCO et prospects — FC 27

Instantané au 8 octobre 2026 : 90 joueurs, dont 30 joueurs de l’effectif professionnel masculin DFCO et 60 prospects désormais issus de fiches de joueurs réels FC 27.

## Ce qui a changé

24 DFCO et 60 prospects possèdent les 29 sous-attributs, les six notes globales, la note générale, le poste FC 27 et le pied fort affichés par FUTWIZ. Cartes de base Bronze/Silver, sans évolution ni bonus de chimie. Les valeurs des six notes globales sont importées directement : elles ne sont pas les moyennes simples des sous-attributs.

Les 6 DFCO absents du filtre du site conservent leurs attributs simulés : {', '.join(missing)}. Cette absence du filtre ne prouve pas une absence dans toute la base FC 27. L’effectif officiel de 30 joueurs est conservé.

Les 60 anciens prospects fictifs sont remplacés dans l’ordre de leurs IDs par des joueurs réels de FUTWIZ. Sélection : {source['selection_prospects']} La sélection sert à la simulation et ne représente pas une recommandation de recrutement ni une disponibilité de transfert. Le nom du club des prospects est laissé vide, car il n’a pas été récupéré sur les fiches consultées.

## Données encore simulées

Âge, naissance, poids, taille, langues, personnalité, spécialités, fatigue, santé, blessures, satisfaction et relations restent simulés. Des fiches FUTWIZ DFCO affichent âge 0, poids 0 et taille / : ces valeurs manquantes n’ont pas remplacé la biométrie simulée. La biométrie des prospects n’a pas été importée. Les mesures et naissances du scénario ne constituent pas des biographies réelles.

Les attributs gardien importés sont DIV, HAN, KIC, REF, SPD et POS. SPD est stocké dans gardien_vitesse. Les sorties restent simulées, car FUTWIZ ne fournit pas cet attribut. Le placement offensif et le placement gardien sont distincts. Les 29 attributs de champ des gardiens sont aussi importés, et leurs six notes de champ utilisent la section PAC/SHO/PAS/DRI/DEF/PHY, pas les six valeurs de la carte gardien.

Les PlayStyles relevés sont conservés séparément, avec leurs libellés anglais, dans playstyles_fc27_observes. Une liste vide signifie aucun libellé relevé. Les specialite_tags français restent des tags du scénario, jamais une traduction supposée d’un PlayStyle officiel.

Les groupes de postes officiels DFCO sont conservés. poste_fc27 et groupe_poste_fc27 décrivent séparément le jeu : par exemple Ylan Aka est classé Attaquant par le DFCO et CDM dans FC 27.

## Fichiers

- joueurs.csv : 90 profils avec statut_import_fc27 et colonnes de provenance.
- blessures.csv : {len(dataset['blessures'])} événements fictifs, inchangés.
- relations.csv : {len(dataset['relations'])} relations fictives dirigées ; contexte scenario_recrutement.
- couverture_fc27.csv : bilan individuel des imports et des absences.
- provenance.csv : origine par joueur et colonne, avec URL lorsque sourcée.
- dictionnaire.csv : définition des colonnes.
- dfco_simulation.json : mêmes données typées, avec metadata et provenance_champs.

Les identifiants des 90 profils restent stables pour conserver les liens des blessures et affinités. Les relations sont désormais des liens de scénario de recrutement ; elles ne prouvent ni relation personnelle réelle ni club commun. Aucun lien neutre. Un effet performance nul peut correspondre à une affinité sociale positive.

CSV : UTF-8 avec BOM, séparateur point-virgule, listes séparées par |, décimales avec point. Dans Excel : Données → À partir d’un fichier texte/CSV, choisir UTF-8 et point-virgule. Vide = null/non renseigné/non applicable, pas zéro. Dates YYYY-MM-DD. Santé VERT disponible, ORANGE vigilance/réathlétisation, ROUGE blessé ; indicateurs et historique sont entièrement fictifs.

## Sources et reproductibilité

Identités et groupes DFCO : https://www.dfco.fr/effectifs/effectif-pro/
Liste FC 27 DFCO : {source['source_effectif']}
Fiches individuelles : fc27_url dans joueurs.csv et URLs dans provenance.csv.

L’instantané relevé depuis les pages visibles est conservé dans sources/fc27_futwiz.json à la racine du projet. Son contrôle d’intégrité a été comparé à la collecte navigateur (24 + 60 fiches). `python update_fc27.py` réapplique cet instantané, sans accès réseau. `python generate_dataset.py` régénère le scénario avec la graine 20261008 puis applique le même instantané FC 27. Ces commandes ne rafraîchissent pas le site.

La première archive simulée est conservée dans data/archives/dfco_dataset_simulation_initiale.zip. Le ZIP principal contient uniquement la version mise à jour et sa documentation.
''', encoding='utf-8')
    for name, rows in [('joueurs.csv', players), ('provenance.csv', provenance), ('couverture_fc27.csv', coverage)]:
        with (OUT / name).open(encoding='utf-8-sig', newline='') as f:
            parsed = list(csv.DictReader(f, delimiter=';'))
        assert len(parsed) == len(rows)
    reloaded = json.loads((OUT / 'dfco_simulation.json').read_text(encoding='utf-8'))
    assert reloaded == dataset
    assert set(players[0]) == {d['colonne'] for d in dictionary if d['table'] == 'joueurs'}
    ids = {p['joueur_id'] for p in players}
    for r in dataset['relations']:
        assert r['joueur_source_id'] in ids and r['joueur_cible_id'] in ids
        assert r['polarite'] in ['POSITIF', 'NEGATIF']
    for b in dataset['blessures']:
        assert b['joueur_id'] in ids
    with zipfile.ZipFile(OUT / 'dfco_dataset.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in ['joueurs.csv', 'blessures.csv', 'relations.csv', 'provenance.csv', 'couverture_fc27.csv', 'dictionnaire.csv', 'dfco_simulation.json', 'README.md']:
            z.write(OUT / name, arcname=name)
    print(json.dumps(dict(joueurs=90, imports_fc27=dict(counts), absents_dfco=missing, validation='OK'), ensure_ascii=False))

if __name__ == '__main__':
    main()
