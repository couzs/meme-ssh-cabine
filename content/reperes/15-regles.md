---
id: regles
titre: Bonnes pratiques
groupe: Repères
intro: Ce qu’on a appris à la dure.
---

### Avant de modifier

- Mongo : `mongodump` avant toute modification ou drop.
- Ne jamais copier un compte mail d’un TMS à un autre : le mot de passe est chiffré avec une clé propre à chaque TMS (l’interface perd toutes les boîtes).
- network.cfg, ferm, extra_exchange.conf : gérés par Puppet. Modification locale = sauvegarde dans /root, prévisualisation, puis report par le N3.
- LMS : rien supprimer sans accord écrit du client. Purge en deux temps : liste contrôlée (nombre, taille, aucune bande-annonce), puis suppression dans la même session.
- Supprimer des DCP pendant un passage d’extra_exchange peut le faire planter : vérifier le verrou ensuite.

### Pièges du terminal

- Coller un bloc pendant une saisie (read, connexion ftp) : les lignes suivantes sont avalées. Taper identifiant et mot de passe à la main, puis coller.
- Sur le TCS : `\ps` contourne l’alias ps ; sysadm voit les dossiers de contenu à 0 (passer par sudo) ; un * dans un dossier protégé se développe avec `sudo sh -c '…'`.
- Distinguer ce qui est littéral de ce qui est à remplacer : les valeurs en jaune viennent des variables du site.
- Telnet sur un JNIOR : une seule commande à la fois, les blocs collés s’entremêlent. Dans jrmon, n’importe quelle touche arrête l’affichage.
- FTP : toujours en binaire pour un DCP ou un fichier .jnior. Le mode ASCII modifie les fins de ligne et abîme les fichiers.
- Un test d’écriture FTP se fait dans le dossier de dépôt (lms/), jamais à la racine.
- Mot de passe refusé deux fois : arrêter et demander le bon, au lieu d’essayer au hasard (risque de blocage de l’IP).

### Confidentialité

- Le fichier ne contient aucune donnée de site : il peut être partagé tel quel. Tes sites restent dans le coffre chiffré de ton navigateur.
- Le presse-papiers Windows garde un historique (Win+V) et peut se synchroniser dans le cloud : désactiver « Synchroniser entre les appareils » dans Paramètres › Système › Presse-papiers.
- Ne pas ouvrir de fichiers HTML inconnus dans le même navigateur que le mémo : ils partagent le stockage local des fichiers.

### Ticket

- Jamais de mot de passe dans un ticket. Un mot de passe tapé par erreur dans le champ identifiant reste en clair dans les journaux du serveur : le faire changer.
- Un problème trouvé dans une salle peut exister dans les autres : vérifier rapidement les salles voisines.
- Noter tout paquet installé sur une machine de prod (ftp, mongodb-clients, nmap…) et tout fichier modifié avec sa sauvegarde.
- Gmail : mot de passe d’application obligatoire avec la validation en deux étapes. Outlook.com : plus de connexion IMAP par mot de passe.
