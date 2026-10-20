# Modifier le contenu

Tout le contenu est dans le dossier `content/`, en fichiers texte. Pas besoin de toucher au code.

## Le circuit d’une modification

1. Dans l’application, clic sur **« Proposer une correction »** sous la fiche (ou ouvrir le fichier sur GitHub).
2. Modifier le texte dans l’éditeur de GitHub (icône crayon).
3. **Commit changes** (en bas ou en haut à droite), avec une phrase qui dit ce qui change.
4. GitHub vérifie le contenu (onglet *Actions*, coche verte ou croix rouge) et Cloudflare reconstruit le site.
5. Une à deux minutes plus tard, chaque personne qui a le mémo ouvert voit le bandeau **« Une nouvelle version du mémo est en ligne »**.

Si la vérification échoue (croix rouge), **rien n’est publié** : la version en ligne reste la précédente. Le message d’erreur dit quel fichier et quelle ligne corriger.

Pense à ajouter une ligne dans `content/nouveautes.yaml` pour les changements utiles à l’équipe.

## Ajouter une commande

Dans le fichier de la rubrique (`content/commandes/NN-rubrique.yaml`), ajouter un bloc sous `commandes:`. Modèle complet :

```yaml
  - id: espace-disque                # identifiant unique : minuscules, chiffres, tirets
    titre: Espace disque             # titre affiché
    machine: lin                     # tms, orc, lms, lin (tout Linux), dor (Doremi), jnr (JNIOR), win (PC)
    niveau: info                     # info (lecture), action (modifie), danger (risque)
    commande: |-
      df -h
    but: 'À quoi sert la commande, en une ou deux phrases.'
    detail: |
      df → disk free : espace des disques
      -h → tailles lisibles (K, M, G, T)
    exemple: |
      Filesystem      Size  Used Avail Use% Mounted on
      /dev/sda2        92G   41G   47G  47% /
    lecture: |
      - **Use%** : le chiffre à regarder.
      - 100 % = panne.
    attendu: 'Moins de 90 %'
    si_ko: 'Ce qu’il faut faire si le résultat n’est pas bon.'
    attention: 'Un avertissement affiché en rouge.'
    voir: [inodes, disk-sys]           # autres fiches, procédures ou pages liées
    mots: [disque, plein, df]          # mots de recherche en plus
    maj: 2026-10-18                    # date d’ajout ou de mise à jour : badge « nouveau » pendant 30 jours
```

Seuls `id`, `titre`, `machine`, `niveau` et `commande` sont obligatoires. Tout le reste est facultatif, mais c’est ce qui rend l’outil pédagogique.

### Règles d’écriture

- **commande** : toujours avec `|-` puis la commande sur la ligne suivante, décalée de 6 espaces. Aucun échappement à faire, même avec des guillemets ou des `$`.
- **detail** : une ligne par morceau de commande, sous la forme `morceau → explication` (la flèche entourée d’espaces).
- **exemple** : la sortie telle qu’elle s’affiche, avec `|`. Si elle commence par des espaces, ce n’est pas un problème.
- Dans `but`, `lecture`, `attendu`, `si_ko`, `attention` : `` `code` `` pour du code, `**gras**`, et des lignes commençant par `- ` pour une liste.
- Texte sur une ligne avec une apostrophe ou un deux-points : l’entourer de guillemets simples `'…'` (et doubler une apostrophe droite : `''`). Les apostrophes typographiques `’` ne posent aucun problème.

### Variables

Pour une valeur qui change d’un site à l’autre, utiliser une variable entre accolades : `ping -c 3 {IP}`. Elle sera remplacée par la valeur saisie dans « Mon site ».

- Liste des variables : `content/variables.yaml`.
- Nouvelle variable : ajouter un bloc dans ce fichier (`cle`, `libelle`, `groupe`, `format`, `exemple`).
- Formats disponibles : `ip`, `net3` (3 octets), `mac`, `iface`, `path`, `film`, `winif`, `uuid`, `port`, `code`, `host`, `svc`.

**Aucune donnée réelle de site** dans le contenu : pas d’IP, de nom de cinéma ou de mot de passe. Le build refuse toute IP écrite en dur hors des adresses de documentation (`192.0.2.x`, `198.51.100.x`, `203.0.113.x`) et des exemples déclarés dans `site.yaml`.

## Ajouter une procédure

Créer un fichier `content/procedures/mon-id.yaml` :

```yaml
id: mon-id
theme: Stockage                      # un des thèmes de site.yaml
titre: LMS plein
quand: 'Le symptôme vu par le client ou par le technicien.'
symptomes: [disque plein, kdm ftp]   # mots de recherche en plus
comprendre: |
  Ce qui se passe et pourquoi on vérifie dans cet ordre.
etapes:
  - ref: espace-disque               # reprend une commande existante (avec son explication)
    titre: Remplissage               # titre propre à l’étape (facultatif)
    attendu: 'Remplace l’attendu de la fiche si besoin'
  - titre: Étape avec sa propre commande
    machine: lms
    niveau: action
    commande: |-
      sudo du -sh /opt/lms-ymagis/*
    attendu: 'Ce qu’on doit voir'
  - titre: Validation du client
    machine: man                     # étape manuelle : pas de commande
    consigne: 'Ce qu’il faut faire ou demander.'
attention: 'Avertissement en fin de procédure.'
copier_tout: false                   # facultatif : masque « Copier tout »
maj: 2026-10-18
```

Préférer `ref:` dès qu’une commande existe déjà : l’étape profite de toutes les explications de la fiche et une correction de la fiche corrige aussi la procédure.

## Ajouter une page (Apprendre ou Repères)

Un fichier Markdown dans `content/apprendre/` ou `content/reperes/`, avec un en-tête :

```markdown
---
id: mon-guide
titre: Titre du guide
intro: 'Une phrase d’introduction.'
---

## Une partie

Du texte, des listes, des tableaux, du `code`.
```

## Vérifier avant d’enregistrer (facultatif)

En local : `npm run check`. Sur GitHub, la vérification se lance toute seule à chaque enregistrement.
