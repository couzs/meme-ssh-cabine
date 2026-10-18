---
id: lire-un-resultat
titre: Lire un résultat de commande
groupe: Apprendre
intro: 'Comment savoir si une commande a marché, repérer l’information utile dans une sortie et comprendre les messages d’erreur les plus courants.'
---

## A-t-elle marché ?

- **Aucun message** n’est souvent une bonne nouvelle : sous Linux, une commande qui réussit se tait (`cp`, `rm`, `ip addr add`).
- Un message qui commence par le nom de la commande suivi de deux points (`rm: cannot remove…`) est une **erreur**.
- Pour en être sûr, tape `echo $?` juste après : `0` = succès, autre chose = échec.

## Repérer l’information utile

- **Tableaux** (`df -h`, `ps`, `ss`) : lis d’abord la ligne de titres, puis cherche la colonne qui t’intéresse (`Use%`, `%CPU`, `Local Address`).
- **Journaux** : chaque ligne commence par une date. Lis les dernières lignes d’abord, puis remonte jusqu’à la première erreur : c’est souvent la cause, les suivantes n’en sont que les conséquences.
- **Piles Java** : un bloc de lignes `at org.…` suit un message d’erreur. Le message utile est **juste au-dessus** du bloc.
- Le mémo affiche sous chaque commande un bloc vert **Attendu** : compare ta sortie avec lui.

## Les erreurs les plus courantes

| Message | Ce que ça veut dire | Que faire |
|---|---|---|
| `command not found` | l’outil n’est pas installé sur cette machine | chercher l’alternative dans la fiche (ex. `/dev/tcp` au lieu de `nc`) |
| `Permission denied` | droits insuffisants | relancer avec `sudo` devant, ou passer root (`sudo -i`) |
| `No such file or directory` | chemin faux ou fichier absent | vérifier le chemin avec `ls`, attention aux majuscules |
| `No space left on device` | disque plein (ou plus d’inodes) | `df -h` puis `df -i` |
| `Connection refused` | la machine répond mais rien n’écoute sur ce port | service arrêté, ou mauvais port |
| `Connection timed out` / `No route to host` | la machine ne répond pas du tout | éteinte, mauvaise IP, câble, réseau |
| `Name or service not known` | nom introuvable (DNS) | utiliser l’IP, vérifier le DNS |
| `Device or resource busy` | fichier ou disque en cours d’utilisation | trouver qui l’utilise (`lsof`) |

## Les tailles et les unités

- `-h` (human) affiche K, M, G, T. Sans `-h`, les tailles sont en blocs ou en octets.
- 1 Go = 1 000 000 000 octets environ. Un long métrage en DCP pèse de 100 à 400 Go.
- Dans `ls -l`, la 5e colonne est la taille en octets.

## Les codes FTP

| Code | Sens |
|---|---|
| `230` | connexion acceptée |
| `150` | transfert qui démarre |
| `226` | transfert terminé avec succès |
| `257` | dossier créé |
| `530` | identifiant ou mot de passe refusé |
| `550` | action refusée : lire la suite du message (`No space`, `Permission denied`, `No such file`) |
