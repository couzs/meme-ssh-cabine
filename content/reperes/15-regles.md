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
- Coller plusieurs commandes d’un coup est dangereux si l’une d’elles demande un mot de passe (`sudo`, `ssh`, `ftp`) : le mot de passe avale les lignes suivantes. Le mémo ne propose « Copier tout » que lorsque c’est sans risque.
- Telnet sur un JNIOR : une seule commande à la fois, les blocs collés s’entremêlent. Dans jrmon, n’importe quelle touche arrête l’affichage.
- FTP : toujours en binaire pour un DCP ou un fichier .jnior. Le mode ASCII modifie les fins de ligne et abîme les fichiers.
- Un test d’écriture FTP se fait dans le dossier de dépôt (lms/), jamais à la racine.
- Mot de passe refusé deux fois : arrêter et demander le bon, au lieu d’essayer au hasard (risque de blocage de l’IP).
- Vérifier le nom de la machine dans l’invite (`root@…tms0000`, `…orc0001`, `…yms0001`) avant de lancer une commande : le même test lancé sur la mauvaise machine donne un résultat vrai mais trompeur.
- Ne pas copier une commande depuis un message où un nom de domaine s’est transformé en lien (`[nom](https://…)`) : le lien se colle dans la commande et la casse. Retaper le nom.
- `curl` est souvent absent du TMS et de l’ORC : tester un port avec `bash -c 'echo > /dev/tcp/HÔTE/PORT'` ; ne pas installer de paquet pour un diagnostic.
- Un service « actif » ou une interface « UP » ne prouve pas que le trafic passe : comparer les octets entrés et revenus, ou capturer le trafic.
- BIOS ou menu de démarrage protégé par mot de passe : ne jamais chercher à le contourner (cavalier, reset). C’est au N3 ou au constructeur.

### Avant de redémarrer

- **Relever avant de redémarrer** : un reboot efface les fichiers temporaires et remet le disque à un taux normal. Les journaux (MongoDB, service concerné, Tomcat) et l’heure de la panne se copient *avant*, pas après.
- Sur l’ORC, `systemctl` n'existe pas : `reboot`. Jamais `reboot -f`. Vérifier d'abord `who` : un collègue est peut-être connecté.
- Un disque à 20 % le lendemain ne prouve pas qu'il n'a pas été plein la veille : lire l'heure des erreurs, pas le taux du moment.

### Répondre au client à partir de journaux

- **Séparer ce qui est prouvé de ce qui est déduit.** Prouvé : un ordre reçu, une macro exécutée, une heure. Déduit : « la pause a arrêté la lecture », « le Quick DCP a rempli le disque ». Écrire « très probable » ou « déduction », jamais un fait.
- **Une commande exécutée n'est pas un effet.** Un journal montre « macro LampOff exécutée », pas « lampe éteinte ». Dire « aucune commande d'extinction n'a été exécutée », pas « la lampe ne s'éteint pas ».
- **Dire ce qu'on n'a pas pu regarder** : TMS tiers inaccessible, journaux chiffrés, état réel d'un équipement. Ne pas essayer d'entrer dans le TMS d'un concurrent.
- **Compter sans exagérer** : « une playlist comparée » et non « les playlists d'avant ». « Sur la période analysée » plutôt que « jamais ».
- **Convertir les heures.** Journaux Barco en UTC, JNIOR en GMT, Doremi à l'heure du serveur : dire dans le message de quelle heure il s'agit.
- **Ne pas attribuer une action à une personne.** Une adresse IP et un nom de client logiciel disent *quel équipement* a envoyé l'ordre, pas *qui* ni *pourquoi* (clic d'un utilisateur ou règle automatique laissent la même trace). Poser la question au client.
- **Relire chaque phrase avant d'envoyer** : retrouver pour chacune la ligne de journal qui la prouve. Retirer ou reformuler ce qui n'en a pas.
- Le client peut accéder au TMS par un **lien intermédiaire** (proxy d'accès) : ne pas déduire du lien comment le TMS identifie ses utilisateurs.
- Une erreur `530 Login incorrect` est une erreur **FTP**, pas une connexion web ratée.

### Confidentialité

- Le fichier ne contient aucune donnée de site : il peut être partagé tel quel. Tes sites restent dans le coffre chiffré de ton navigateur.
- Le presse-papiers Windows garde un historique (Win+V) et peut se synchroniser dans le cloud : désactiver « Synchroniser entre les appareils » dans Paramètres › Système › Presse-papiers.
- Ne pas ouvrir de fichiers HTML inconnus dans le même navigateur que le mémo : ils partagent le stockage local des fichiers.

### Ticket

- Jamais de mot de passe dans un ticket. Un mot de passe tapé par erreur dans le champ identifiant reste en clair dans les journaux du serveur : le faire changer.
- Une salle absente de Smarty est le plus souvent injoignable sur le réseau : le prouver depuis le TMS avant de relancer quoi que ce soit.
- Redémarrer Tomcat coupe tout le TMS (plugins compris) : accord du client, hors séance.
- Un problème trouvé dans une salle peut exister dans les autres : vérifier rapidement les salles voisines.
- Noter tout paquet installé sur une machine de prod (ftp, mongodb-clients, nmap…) et tout fichier modifié avec sa sauvegarde.
- Gmail : mot de passe d’application obligatoire avec la validation en deux étapes. Outlook.com : plus de connexion IMAP par mot de passe.
