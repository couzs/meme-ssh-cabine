# Mémo SSH Cabine

Commandes et procédures pas à pas pour le support cabine cinéma (TMS, ORC, LMS, Doremi, Barco, JNIOR, Dolby).
Une application web unique, partagée par toute l’équipe et mise à jour en direct : on modifie un fichier texte, le site se reconstruit tout seul en une à deux minutes.

## Ce que fait l’outil

- **Procédures** par symptôme (« TMS inaccessible », « LMS plein », « Automations lumière KO »…), étape par étape, avec la machine sur laquelle taper, le résultat attendu et l’explication de chaque commande.
- **Fiches de commandes** pédagogiques : à quoi sert la commande, décomposition de chaque option, exemple de résultat, comment le lire, que faire si ça ne va pas.
- **Apprendre** : guides pour débuter en SSH, lire un résultat, l’essentiel de Linux, le réseau en 5 minutes.
- **Mon site** : les IP du site s’insèrent dans toutes les commandes. Chaque valeur est contrôlée (format imposé) ; les sites sont mémorisés dans un coffre chiffré du navigateur (AES-256), jamais sur le serveur.
- **Sécurité de copie** : commandes classées *lecture* / *modifie* / *risque* ; une commande qui modifie ne se copie pas tant que ses variables ne sont pas remplies ; une commande à risque demande une confirmation.
- Recherche instantanée, filtres par machine, favoris, liens directs vers chaque fiche (pour les tickets), thème clair/sombre, mode Guidé / Standard / Compact, version hors ligne, application installable (PWA), bandeau « nouvelle version disponible ».

## Organisation du dépôt

```
content/                ← tout le contenu, à modifier ici
  site.yaml             réglages : titre, machines, niveaux, thèmes, dépôt GitHub
  variables.yaml        variables du site ({IP}, {LMS}…) et leur format
  commandes/NN-*.yaml   une rubrique de commandes par fichier
  procedures/*.yaml     une procédure par fichier
  apprendre/*.md        guides pour débuter (Markdown)
  reperes/*.md          glossaire, repères ORC, Barco, salle, bonnes pratiques
  nouveautes.yaml       journal affiché dans l’application
src/                    l’application (HTML, CSS, JS)
public/                 fichiers servis tels quels (icône, manifeste, en-têtes de sécurité)
scripts/build.mjs       valide le contenu et assemble dist/
```

## Modifier le contenu

Voir **[docs/MODIFIER-LE-CONTENU.md](docs/MODIFIER-LE-CONTENU.md)** : ajouter une commande, une procédure, une variable, avec des modèles à copier.

Le plus simple : dans l’application, chaque fiche a un lien **« Proposer une correction »** qui ouvre le bon fichier sur GitHub. On modifie, on clique sur *Commit changes*, et c’est en ligne une à deux minutes plus tard.

## Mise en ligne

Voir **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)** : Cloudflare Pages (gratuit) + Cloudflare Access pour réserver l’accès à l’équipe.

## En local

```bash
npm install
npm run check    # valide le contenu sans rien construire
npm run build    # construit dist/ (dist/index.html s’ouvre aussi directement dans un navigateur)
npm run serve    # aperçu sur http://localhost:8080, reconstruit à chaque modification
```

Si le contenu contient une erreur (YAML mal formé, variable inconnue, lien cassé, IP réelle écrite en dur…), le build s’arrête avec un message qui dit quel fichier corriger : la version en ligne reste la précédente.
