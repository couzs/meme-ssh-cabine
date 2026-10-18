---
id: debuter
titre: Débuter en SSH
groupe: Apprendre
intro: 'Se connecter à une machine, lire l’invite, copier-coller sans risque : les dix minutes qui évitent la plupart des erreurs.'
---

## Se connecter

SSH ouvre un terminal sur une machine distante. Depuis ton poste (PuTTY, Windows Terminal, MobaXterm) ou depuis le TMS vers une autre machine :

```
ssh sysadm@192.0.2.4
```

- `sysadm` est l’utilisateur, `192.0.2.4` l’adresse de la machine.
- Le mot de passe **ne s’affiche pas** pendant la frappe : c’est normal, tape-le et valide.
- À la première connexion, SSH demande de confirmer l’empreinte de la machine : réponds `yes`.

> Mot de passe refusé deux fois : arrête-toi et demande le bon. Trop d’essais peuvent bloquer ton IP.

## Lire l’invite

L’invite te dit **qui** tu es, **où** tu es et **avec quels droits** :

| Invite | Signification |
|---|---|
| `sysadm@frmXXXXtms0000:~$` | utilisateur sysadm, sur le TMS, dans son dossier personnel (`~`), droits normaux (`$`) |
| `root@frmXXXXorc0001:/etc#` | root (administrateur), sur l’ORC, dans `/etc`, tous les droits (`#`) |
| `ftp>` | tu es dans le client FTP : seules les commandes FTP marchent |
| `>` | console d’un JNIOR ou de Mongo |

Avant chaque commande qui modifie quelque chose, **relis l’invite** : c’est la bonne machine ?

## Copier-coller

- Dans le mémo, clique sur une commande : elle est copiée avec les valeurs de ton site.
- Dans PuTTY : **clic droit** colle. Dans Windows Terminal : **Ctrl+V** ou clic droit. Dans un terminal Linux : **Ctrl+Maj+V**.
- Ne colle jamais un bloc pendant qu’une connexion demande un identifiant ou un mot de passe (ftp, telnet) : les lignes suivantes sont avalées. Tape l’identifiant à la main, puis colle.

## Les touches qui sauvent

| Touche | Effet |
|---|---|
| `Ctrl+C` | arrête la commande en cours (un ping, un tail -f, une capture) |
| `q` | quitte un affichage page par page (`less`, `systemctl status`, `top`) |
| `Tab` | complète un nom de fichier ou de commande |
| `↑` / `↓` | rappelle les commandes précédentes |
| `Ctrl+R` | cherche dans l’historique : tape un bout de commande |
| `exit` ou `Ctrl+D` | ferme la session (ou quitte root pour revenir à ton utilisateur) |

## Les niveaux de risque du mémo

- **Lecture** : la commande regarde sans rien changer. Tu peux la lancer sans hésiter.
- **Modifie** : elle change quelque chose (service, IP, fichier). Le mémo refuse de la copier tant que ses variables ne sont pas remplies.
- **Risque** : elle coupe un service ou supprime des données. Il faut cliquer deux fois, relire, et souvent avoir l’accord écrit du client.

## Avant de toucher à quoi que ce soit

1. `whoami ; hostname` : bonne machine, bon utilisateur ?
2. `w` : un collègue est-il connecté en même temps ?
3. `date` et `df -h` : l’heure et le disque, causes fréquentes de pannes.
4. Note dans le ticket tout ce que tu modifies et la sauvegarde que tu as faite.
