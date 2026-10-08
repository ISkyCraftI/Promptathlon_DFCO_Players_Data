"""Jeu de simulation DFCO reproductible, sans dépendance externe."""
import csv
import json
import random
import zipfile
from datetime import date, timedelta
from pathlib import Path

R = random.Random(20261008)
REF = date(2026, 10, 8)
OUT = Path(__file__).resolve().parent / 'data'
OUT.mkdir(exist_ok=True)
SOURCE = 'https://www.dfco.fr/effectifs/effectif-pro/'
ROSTER = {
    'Gardien': ['Enzo Ketterle', 'Paul Delecroix', 'Ylann Marie-Rose'],
    'Défenseur': ['Tom Meynadier', 'Brayan Djadja', 'Moussa Faty', 'Axel Bargain', 'Ismaïl Bouleghcha', 'Lenny Lacroix', 'Anass Benyahya', 'Waly Diouf', 'Quentin Bernard', 'César Obongo'],
    'Milieu': ['Michaël Barreto', 'Samy Chouchane', 'Brandon Ndezi', 'Paul Bellon', 'Ben-Chayeel Hamada', 'Jordan Marié', 'Adel Lembezat', 'Hugo Vargas-Rios', 'Hatem Mimoune'],
    'Attaquant': ['Ange Lago', 'Ylan Aka', 'Julio Tavares', 'Alexis Ntamack', 'Yanis Barka', 'Florian Rombogouera', 'Tyris Dong', 'Abd-Elmajid Djae'],
}
GROUPS = {
    'vitesse': ['acceleration', 'vitesse_de_pointe'],
    'frappe': ['placement_offensif', 'finition', 'puissance_de_tir', 'tir_de_loin', 'volee', 'penalty'],
    'passe': ['vista', 'centre', 'precision_coup_franc', 'passe_courte', 'passe_longue', 'effet'],
    'dribble': ['agilite', 'equilibre', 'reactivite', 'conduite_de_balle', 'dribble', 'calme'],
    'defense': ['interception', 'precision_de_la_tete', 'lucidite_defensive', 'tacle_debout', 'tacle_glisse'],
    'physique': ['detente', 'endurance', 'force', 'agressivite'],
}
GK = ['gardien_plongeon', 'gardien_prise_de_balle', 'gardien_jeu_au_pied', 'gardien_reflexes', 'gardien_sorties', 'gardien_placement']
BASE = {'Gardien': [40, 25, 47, 42, 24, 64], 'Défenseur': [62, 40, 54, 48, 68, 70], 'Milieu': [65, 57, 70, 68, 54, 63], 'Attaquant': [73, 69, 57, 72, 29, 62]}
PERSONALITIES = ['Calme', 'Meneur', 'Ambitieux', 'Collectif', 'Compétiteur', 'Discret', 'Persévérant', 'Extraverti']
SPECIALTIES = {'Gardien': ['Le Mur', 'Réflexes éclair'], 'Défenseur': ['Le Mur', 'Jeu aérien', 'Expert Cardio'], 'Milieu': ['Métronome', 'Expert Cardio', 'Créateur'], 'Attaquant': ['Tir en finesse', 'Sprinteur', 'Renard des surfaces']}
players, injuries, relations = [], [], []

def player(name, position, kind, index):
    pid = f"{'DFCO' if kind == 'DFCO' else 'PRO'}_{index:03d}"
    age = R.randint(18, 37) if kind == 'DFCO' else R.randint(18, 29)
    birth = date(REF.year - age, R.randint(1, 12), R.randint(1, 28))
    age = REF.year - birth.year - ((REF.month, REF.day) < (birth.month, birth.day))
    height = R.randint(183, 198) if position == 'Gardien' else R.randint(168, 195)
    weight = round((height - 100) * R.uniform(.86, 1.02), 1)
    p = dict(joueur_id=pid, nom=name, type_joueur=kind, club='DFCO' if kind == 'DFCO' else f'Club fictif {1 + (index % 12):02d}',
             groupe_poste=position, gardien=position == 'Gardien', date_reference=REF.isoformat(),
             date_naissance_simulee=birth.isoformat(), age=age, taille_cm=height, poids_kg=weight,
             pied_fort=R.choices(['Droit', 'Gauche', 'Ambidextre'], [70, 25, 5])[0],
             personnalite_tags=R.sample(PERSONALITIES, 2), specialite_tags=R.sample(SPECIALTIES[position], 2),
             langues_parlees=R.choice([['français'], ['français', 'anglais'], ['français', 'espagnol'], ['français', 'arabe'], ['français', 'portugais']]),
             relation_equipe_score=R.randint(25, 95), satisfaction_score=R.randint(20, 98),
             satisfaction_motif='', fatigue_score=R.randint(5, 65), sante_score=0,
             statut_sante='', indicateur_sante='', disponibilite='', retour_prevu=None,
             nb_blessures_12_mois=0, affinites_positives_ids=[], affinites_negatives_ids=[],
             provenance_identite='source_publique' if kind == 'DFCO' else 'fictif',
             provenance_groupe_poste='source_publique' if kind == 'DFCO' else 'simule',
             provenance_autres_champs='simule', source_url=SOURCE if kind == 'DFCO' else '',
             source_consultee_le=REF.isoformat() if kind == 'DFCO' else None)
    p['satisfaction_motif'] = 'Temps de jeu souhaité' if p['satisfaction_score'] < 45 else ('Adaptation en cours' if p['satisfaction_score'] < 65 else 'Projet sportif apprécié')
    p['relation_equipe_general'] = 'Tendue' if p['relation_equipe_score'] < 40 else ('En intégration' if p['relation_equipe_score'] < 65 else 'Bonne cohésion')
    talent = R.randint(-14, 13)
    for (group, attributes), base in zip(GROUPS.items(), BASE[position]):
        for attr in attributes:
            p[attr] = max(1, min(99, base + talent + R.randint(-12, 12)))
        p['note_' + group] = round(sum(p[a] for a in attributes) / len(attributes), 1)
    for attr in GK:
        p[attr] = max(1, min(99, 68 + talent + R.randint(-10, 10))) if p['gardien'] else None
    players.append(p)

for position, names in ROSTER.items():
    for name in names:
        player(name, position, 'DFCO', len(players) + 1)
first = ['Nathan', 'Adam', 'Lucas', 'Ilyes', 'Mathis', 'Noah', 'Sami', 'Hugo', 'Amine', 'Elias', 'Léo', 'Yanis']
last = ['Morel', 'Diallo', 'Laurent', 'Benali', 'Costa', 'Martin', 'Traoré', 'Pereira', 'Roux', 'Simon']
for i in range(60):
    # Identités explicitement fictives, indépendantes des personnes portant le même nom.
    name = f'{first[i % len(first)]} {last[i // len(first)]} (prospect fictif {i + 1:02d})'
    position = (['Gardien'] * 6 + ['Défenseur'] * 18 + ['Milieu'] * 18 + ['Attaquant'] * 18)[i]
    player(name, position, 'PROSPECT', i + 1)

for p in players:
    for _ in range(R.choices([0, 1, 2, 3], [25, 45, 25, 5])[0]):
        start = REF - timedelta(days=R.randint(65, 340))
        duration = R.randint(5, 40)
        injuries.append(dict(blessure_id=f'BLE_{len(injuries) + 1:04d}', joueur_id=p['joueur_id'],
            type_blessure=R.choice(['Entorse cheville', 'Lésion musculaire', 'Contusion']),
            zone=R.choice(['Cheville droite', 'Cheville gauche']) , gravite='Légère' if duration <= 14 else 'Modérée',
            debut=start.isoformat(), retour_prevu=(start + timedelta(days=duration)).isoformat(),
            retour_effectif=(start + timedelta(days=duration)).isoformat(), statut='Terminée', provenance='simule'))
        # Une zone compatible avec le type de blessure.
        if injuries[-1]['type_blessure'] == 'Lésion musculaire': injuries[-1]['zone'] = 'Ischio-jambiers'
        if injuries[-1]['type_blessure'] == 'Contusion': injuries[-1]['zone'] = 'Cuisse'
    status = R.choices(['Disponible', 'Vigilance', 'Blessé', 'Réathlétisation'], [65, 15, 12, 8])[0]
    if status in ['Blessé', 'Réathlétisation']:
        start = REF - timedelta(days=R.randint(2, 15))
        end = REF + timedelta(days=R.randint(5, 30))
        injuries.append(dict(blessure_id=f'BLE_{len(injuries) + 1:04d}', joueur_id=p['joueur_id'],
            type_blessure='Lésion musculaire', zone='Ischio-jambiers', gravite='Modérée', debut=start.isoformat(),
            retour_prevu=end.isoformat(), retour_effectif=None, statut=status, provenance='simule'))
        p['retour_prevu'] = end.isoformat()
    p['statut_sante'] = status
    p['indicateur_sante'] = {'Disponible': 'VERT', 'Vigilance': 'ORANGE', 'Blessé': 'ROUGE', 'Réathlétisation': 'ORANGE'}[status]
    p['disponibilite'] = {'Disponible': 'Match et entraînement', 'Vigilance': 'Charge adaptée', 'Blessé': 'Indisponible', 'Réathlétisation': 'Entraînement adapté'}[status]
    p['sante_score'] = R.randint(*{'Disponible': (85, 100), 'Vigilance': (65, 84), 'Blessé': (20, 49), 'Réathlétisation': (50, 64)}[status])
    p['nb_blessures_12_mois'] = sum(b['joueur_id'] == p['joueur_id'] for b in injuries)

for p in players:
    # Relations dirigées : le ressenti ou l'effet A -> B n'implique pas B -> A.
    targets = R.sample([q for q in players if q['joueur_id'] != p['joueur_id'] and q['club'] == p['club']], min(3, sum(q['club'] == p['club'] for q in players) - 1))
    for i, q in enumerate(targets):
        positive = i < 2
        nature = R.choice(['Chimie sportive', 'Affinité personnelle']) if positive else 'Friction simulée'
        r = dict(relation_id=f'REL_{len(relations) + 1:04d}', joueur_source_id=p['joueur_id'], joueur_cible_id=q['joueur_id'],
            polarite='POSITIF' if positive else 'NEGATIF', nature=nature,
            intensite=R.randint(15, 90), effet_performance_pct=R.randint(1, 8) if nature == 'Chimie sportive' else (-R.randint(1, 5) if not positive else 0),
            motif='Automatismes complémentaires' if nature == 'Chimie sportive' else ('Bonne entente' if positive else 'Désaccord dans le scénario'),
            date_reference=REF.isoformat(), provenance='simule')
        relations.append(r)
        p['affinites_positives_ids' if positive else 'affinites_negatives_ids'].append(q['joueur_id'])

def write_csv(name, rows):
    with (OUT / name).open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]), delimiter=';')
        w.writeheader()
        for row in rows:
            w.writerow({k: '|'.join(v) if isinstance(v, list) else (int(v) if isinstance(v, bool) else v) for k, v in row.items()})

descriptions = {
    'joueur_id': 'Identifiant stable, clé primaire.', 'nom': 'Nom public DFCO ou identité fictive explicitement nommée.',
    'type_joueur': 'DFCO ou PROSPECT.', 'club': 'DFCO ou club fictif.', 'groupe_poste': 'Groupe de poste, pas poste tactique détaillé.',
    'gardien': 'Booléen. CSV : 1 gardien, 0 joueur de champ.', 'date_reference': 'Date du scénario, ISO 8601.',
    'date_naissance_simulee': 'Date fictive utilisée pour calculer un âge cohérent, jamais biographie vérifiée.',
    'age': 'Années révolues calculées au 08/10/2026 à partir de la naissance simulée.',
    'taille_cm': 'Taille simulée en centimètres.', 'poids_kg': 'Poids simulé en kilogrammes.',
    'pied_fort': 'Droit, Gauche ou Ambidextre, simulé.', 'personnalite_tags': 'Liste de tags simulés.',
    'specialite_tags': 'Liste de spécialités simulées, labels descriptifs sans règle de bonus.',
    'langues_parlees': 'Liste de langues simulées, sans déduction de la nationalité.',
    'relation_equipe_score': 'Intégration simulée 0–100. Indépendante des relations individuelles.',
    'relation_equipe_general': 'Tendue <40 ; En intégration 40–64 ; Bonne cohésion ≥65.',
    'satisfaction_score': 'Satisfaction simulée 0–100, valeur élevée = satisfait.',
    'satisfaction_motif': 'Motif simulé de satisfaction.', 'fatigue_score': 'Fatigue simulée 0–100, valeur élevée = fatigué.',
    'sante_score': 'Score de scénario 0–100 lié au statut, sans interprétation médicale.',
    'statut_sante': 'Disponible, Vigilance, Blessé ou Réathlétisation.',
    'indicateur_sante': 'VERT disponible ; ORANGE vigilance/réathlétisation ; ROUGE blessé.',
    'disponibilite': 'Résumé de disponibilité pour éviter d’ouvrir la fiche santé.',
    'retour_prevu': 'Date ISO simulée, vide/null si aucune blessure active.',
    'nb_blessures_12_mois': 'Nombre d’événements débutés dans les 365 jours précédant la référence.',
    'affinites_positives_ids': 'Liste des cibles de relations positives dirigées.',
    'affinites_negatives_ids': 'Liste des cibles de relations négatives dirigées.',
    'provenance_identite': 'source_publique ou fictif.', 'provenance_groupe_poste': 'source_publique ou simule.',
    'provenance_autres_champs': 'simule pour tous les autres champs hors source et identifiant.',
    'source_url': 'Source de l’identité et du groupe de poste uniquement.', 'source_consultee_le': 'Date de consultation ISO.',
    'blessure_id': 'Identifiant de l’événement.', 'type_blessure': 'Type de blessure simulé.', 'zone': 'Zone concernée simulée.',
    'gravite': 'Légère ou Modérée, label du scénario.', 'debut': 'Date de début simulée ISO.',
    'retour_effectif': 'Date de retour ISO ; null/vide pour une blessure active.', 'statut': 'Terminée, Blessé ou Réathlétisation.',
    'provenance': 'simule.', 'relation_id': 'Identifiant de relation.', 'joueur_source_id': 'Joueur qui ressent ou bénéficie de la relation.',
    'joueur_cible_id': 'Joueur visé par la relation.', 'polarite': 'POSITIF ou NEGATIF uniquement, aucune ligne neutre.',
    'nature': 'Chimie sportive, Affinité personnelle ou Friction simulée.', 'intensite': 'Force de relation simulée 1–100.',
    'effet_performance_pct': 'Variation fictive en points de pourcentage : +1 à +8, 0 pour affinité sociale, −1 à −5 pour friction. Règle indicative à implémenter dans votre simulateur.',
    'motif': 'Explication fictive de relation.',
}
dictionary = []
for table, rows in [('joueurs', players), ('blessures', injuries), ('relations', relations)]:
    for key, sample in rows[0].items():
        if key in GK:
            desc = 'Attribut gardien simulé 1–99 ; null/vide pour joueurs de champ.'
        elif key.startswith('note_'):
            desc = 'Moyenne arithmétique des sous-attributs du groupe, arrondie à 1 décimale. Valeur figée à régénérer si les notes changent.'
        elif any(key in attrs for attrs in GROUPS.values()):
            desc = 'Attribut technique simulé, entier 1–99 (échelle sur 100).'
        else:
            desc = descriptions[key]
        dictionary.append(dict(table=table, colonne=key, type='liste' if isinstance(sample, list) else 'booleen' if isinstance(sample, bool) else 'nombre' if isinstance(sample, (int, float)) else 'texte_ou_date', description=desc))

# Validation des exports et de leurs clés étrangères.
ids = {p['joueur_id'] for p in players}
assert len(ids) == len(players) == 90
assert sum(p['type_joueur'] == 'DFCO' for p in players) == 30
assert {p['nom'] for p in players[:30]} == {n for names in ROSTER.values() for n in names}
for p in players:
    for attrs in GROUPS.values(): assert all(1 <= p[a] <= 99 for a in attrs)
    assert all((p[a] is not None) == p['gardien'] for a in GK)
    assert set(p['affinites_positives_ids']).isdisjoint(p['affinites_negatives_ids'])
    active = [b for b in injuries if b['joueur_id'] == p['joueur_id'] and b['statut'] != 'Terminée']
    assert bool(active) == (p['statut_sante'] in ['Blessé', 'Réathlétisation'])
for b in injuries:
    assert b['joueur_id'] in ids
    assert b['debut'] <= REF.isoformat() and b['debut'] < b['retour_prevu']
for r in relations:
    assert r['joueur_source_id'] in ids and r['joueur_cible_id'] in ids
    assert r['joueur_source_id'] != r['joueur_cible_id']
    assert r['polarite'] in ['POSITIF', 'NEGATIF']

write_csv('joueurs.csv', players)
write_csv('blessures.csv', injuries)
write_csv('relations.csv', relations)
write_csv('dictionnaire.csv', dictionary)
dataset = dict(metadata=dict(date_reference=REF.isoformat(), seed=20261008, source=SOURCE,
    perimetre='Effectif professionnel masculin publié sur la page officielle consultée le 08/10/2026.',
    avertissement='Seuls noms et groupes de poste DFCO sont publics. Toutes les autres valeurs sont simulées, y compris âge, taille, poids, pied, santé, langues et relations. Aucune donnée médicale réelle.',
    echelle_attributs='1–99 sur une échelle de 100', relations='Dirigées, absence de ligne = relation non renseignée, jamais neutre.'),
    joueurs=players, blessures=injuries, relations=relations)
(OUT / 'dfco_simulation.json').write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding='utf-8')
for name, rows in [('joueurs.csv', players), ('blessures.csv', injuries), ('relations.csv', relations), ('dictionnaire.csv', dictionary)]:
    with (OUT / name).open(encoding='utf-8-sig', newline='') as f:
        loaded = list(csv.DictReader(f, delimiter=';'))
        assert len(loaded) == len(rows) and set(loaded[0]) == set(rows[0])
assert len(json.loads((OUT / 'dfco_simulation.json').read_text(encoding='utf-8'))['joueurs']) == 90
(OUT / 'README.md').write_text(f'''# Données de simulation DFCO

90 joueurs : 30 joueurs de l’effectif professionnel masculin publié par le DFCO et 60 prospects fictifs. Source consultée le 8 octobre 2026 : {SOURCE}
Le périmètre exclut réserve, jeunes et équipe féminine. L’effectif correspond à la page publiée, sans garantie sur l’inscription en compétition ou les prêts. Le contenu de la page peut évoluer.

## Provenance

Les noms et groupes de poste des joueurs DFCO sont les seuls faits publics repris. Toutes les autres données sont simulées : naissance, âge, poids, taille, pied fort, notes, personnalité, spécialités, langues, blessures, santé, satisfaction et relations. Les dates de naissance fictives ne doivent pas être utilisées comme biographies réelles. Les prospects et leurs clubs sont entièrement fictifs.
Les tags n’ont pas été déduits de la vie réelle des joueurs. Ce jeu ne constitue pas un fichier médical ou une évaluation sportive réelle.

## Utilisation

- `joueurs.csv` : une ligne par joueur, tous les attributs demandés et résumé santé.
- `blessures.csv` : {len(injuries)} événements, liés par joueur_id. Plusieurs événements possibles par joueur.
- `relations.csv` : {len(relations)} relations dirigées, liées par joueur_source_id et joueur_cible_id.
- `dictionnaire.csv` : description de chaque colonne.
- `dfco_simulation.json` : même jeu de données avec nombres, booléens, listes et valeurs null natives.

CSV en UTF-8 avec BOM, séparateur point-virgule, décimales avec point. Dans Excel : Données → À partir d’un fichier texte/CSV ; choisir UTF-8 et point-virgule. Les listes CSV utilisent `|`. Un champ vide correspond à null ou non applicable, jamais à une note zéro. Les dates suivent YYYY-MM-DD.

Notes techniques : entiers 1–99 sur une échelle de 100, profils générés selon quatre groupes de postes. Les six notes globales sont des moyennes simples, pas des notes EA Sports officielles. Les attributs gardien sont vides pour les joueurs de champ. Les spécialités sont des tags descriptifs indépendants des notes ; votre simulateur définit leurs bonus éventuels.

Relations : A → B n’implique pas B → A. Un joueur possède deux relations positives et une négative avec son équipe/club fictif. L’affinité sociale peut avoir un effet performance nul tout en restant positive. Aucune relation neutre. Absence de relation signifie non renseignée. Le score général d’intégration dans l’équipe est une variable distincte des affinités individuelles. Les effets de performance sont des paramètres fictifs, sans règle de cumul imposée.

Santé : VERT = disponible ; ORANGE = vigilance ou réathlétisation ; ROUGE = blessé. Les blessures actives ont un retour prévu futur et aucun retour effectif. Fatigue et satisfaction vont de 0 à 100. Fatigue élevée = plus fatigué ; satisfaction élevée = plus satisfait. Le score santé est un indicateur de scénario, pas un seuil médical.

## Régénération

Depuis la racine du projet : `python generate_dataset.py`. Graine fixe 20261008. La génération contrôle les effectifs, les identifiants, les bornes, les liens, les statuts santé et la relecture des exports. Les données sont un instantané : toute modification d’une note nécessite le recalcul de sa moyenne, et tout changement de blessure nécessite la mise à jour du résumé santé.
''', encoding='utf-8')
with zipfile.ZipFile(OUT / 'dfco_dataset.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for name in ['joueurs.csv', 'blessures.csv', 'relations.csv', 'dictionnaire.csv', 'dfco_simulation.json', 'README.md']:
        z.write(OUT / name, arcname=name)
print(json.dumps(dict(joueurs=len(players), dfco=30, prospects=60, blessures=len(injuries), relations=len(relations), validation='OK'), ensure_ascii=False))
