---
id: tunnel-ssh
titre: Le tunnel SSH expliqué
groupe: Apprendre
intro: 'Comment atteindre, depuis ton poste, un équipement qui n’est visible que depuis le TMS (un NAS QNAP, une interface web). Le principe, chaque morceau de la commande, et les pièges.'
---

## Le problème

Un NAS QNAP du cinéma est sur le **réseau du cinéma**. Ton poste n’y est pas : il ne peut pas le joindre directement. Le **TMS**, lui, est sur ce réseau **et** accessible en SSH depuis l’extérieur. On l’utilise comme **relais**.

```
ton poste  ───── SSH (chiffré) ─────>  TMS  ─── réseau du cinéma ───>  NAS QNAP
localhost:8443                                                          192.0.2.8:443
```

Un **tunnel SSH** fait croire à ton poste que le NAS est chez lui : quand ton navigateur ouvre `localhost:8443`, la demande part dans le tunnel, sort du TMS et arrive au NAS. La réponse fait le chemin inverse.

## Anatomie de la commande

```
ssh -N -L 8443:192.0.2.8:443 sysadm@tms.exemple.fr
```

| Morceau | Rôle |
|---|---|
| `ssh` | le client SSH de ton poste (PowerShell, Windows Terminal, terminal Linux ou macOS) |
| `-N` | n’exécute aucune commande sur le TMS : la connexion ne sert que de tunnel |
| `-L` | redirection **L**ocale : « ouvre un port chez moi et envoie ce qui y arrive plus loin » |
| `8443` | le port d’écoute **sur ton poste** (au choix, au-dessus de 1024) |
| `192.0.2.8:443` | la destination, **vue depuis le TMS** : l’IP du NAS et son port |
| `sysadm@tms.exemple.fr` | le compte et la machine qui servent de relais |

La phrase à retenir : « le port **8443 de chez moi** est relié au port **443 du NAS**, en passant par le TMS ».

Attention à un détail souvent source d’erreur : l’IP après le premier `:` est celle du **NAS**, pas celle du TMS, et c’est le **TMS** qui s’y connecte, pas ton poste. Elle doit donc être joignable depuis le TMS (c’est ce qu’on teste avant).

## Quatre façons de se servir du NAS

| Besoin | Commande | Ensuite |
|---|---|---|
| Interface web (HTTPS) | `ssh -N -L 8443:IP_NAS:443 sysadm@TMS` | navigateur sur `https://localhost:8443` |
| Interface web (HTTP) | `ssh -N -L 8080:IP_NAS:8080 sysadm@TMS` | navigateur sur `http://localhost:8080` |
| Terminal SSH sur le NAS, une commande | `ssh -J sysadm@TMS admin@IP_NAS` | invite du NAS, deux mots de passe |
| Terminal SSH sur le NAS, deux fenêtres | `ssh -N -L 2222:IP_NAS:22 sysadm@TMS` puis `ssh -p 2222 admin@localhost` | invite du NAS |

- **`-J` (jump host)** : ssh se connecte au TMS puis rebondit vers le NAS tout seul. Il faut un client SSH récent (version 7.3 ou plus). PuTTY ne sait pas le faire : utiliser les deux fenêtres, ou la configuration de tunnel de PuTTY (*Connection > SSH > Tunnels* : port source 8443, destination `IP_NAS:443`, bouton Add, puis ouvrir la session vers le TMS).
- **Deux fenêtres** : la première garde le tunnel ouvert et reste « figée » (c’est normal), la seconde se connecte à `localhost:2222`, que le tunnel envoie vers le NAS.

## Ce qu’on voit, ce qui est normal

- Après le mot de passe d’un `ssh -N -L …`, **rien ne s’affiche et la ligne ne revient pas** : le tunnel est ouvert. Laisse la fenêtre.
- **Alerte de certificat** dans le navigateur : le NAS utilise un certificat auto-signé. Accepte l’exception.
- Le terminal d’un QNAP (`[~] #`) n’est pas un Linux complet : certaines commandes habituelles manquent.

## Les pièges

- **« Address already in use »** : le port local est déjà pris. Change-le (`8444`, `2223`…) et ouvre le même numéro dans le navigateur ou dans `-p`.
- **« REMOTE HOST IDENTIFICATION HAS CHANGED »** : `localhost:2222` a déjà servi pour un autre NAS. Prends un port local différent par NAS, ou efface l’ancienne empreinte sur ton poste avec `ssh-keygen -R "[localhost]:2222"`.
- **« administratively prohibited »** : le TMS refuse les tunnels. La configuration SSH du TMS est gérée par Puppet : ne pas la modifier, demander au N3.
- **« Connection refused » dans la fenêtre du tunnel au moment d’ouvrir la page** : le TMS n’arrive pas à joindre le NAS sur ce port.
- Si tu atteins déjà le TMS par un tunnel fourni par le client (par exemple avec `-p 2201 … @localhost`), garde ces options telles quelles et **ajoute** le `-L`.

## Règles

- **Lecture seule** : consulter l’état des disques, du RAID et de l’espace. Aucune modification, aucun redémarrage ni aucune mise à jour du NAS sans accord écrit du client.
- **Un tunnel ouvert est une porte ouverte** : ferme-le (Ctrl+C) dès que tu as fini.
- **Mots de passe** : fournis par le client, jamais devinés, jamais essayés par défaut, jamais écrits dans un ticket. Un mot de passe refusé deux fois : on s’arrête.
- Coller **une seule commande à la fois** quand un mot de passe est demandé : il avale les lignes suivantes.

La procédure pas à pas, avec les vérifications à faire avant et après, est « Accéder à un NAS QNAP à distance par un tunnel SSH ».
