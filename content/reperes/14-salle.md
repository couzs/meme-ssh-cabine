---
id: salle
titre: Repères salle
groupe: Repères
intro: 'Doremi, JNIOR, Dolby et LMS Debian : chemins, ports, lecture des journaux.'
---

### Doremi (DCP2000 / ShowVault / IMS)

- Journaux : `/doremi/log/*.log`. Configuration : `/doremi/etc/devices.xml` (périphériques) et `/doremi/etc/macros.xml`. Contenus : `/data`.
- Moteur d’ingest : `/doremi/bin/ingestc.out`. Il vérifie taille et hash de chaque fichier contre la PKL.
- Outils absents : nc, timeout, base64, curl. Remplaçants : `/dev/tcp` de bash pour tester un port, `openssl base64` pour encoder un hash.

### JNIOR (modèle 310)

| Port / valeur | Usage |
|---|---|
| 23 | Telnet (admin) |
| 21 | FTP (le JNIOR a aussi un client ftp) |
| 80 | Interface web |
| 9200 | Protocole JNIOR : connexion du serveur de salle |
| 502 | Modbus |
| paquet 26 | Interrogation d’état (toutes les 8 à 9 s), pas une commande |
| paquet 10 | Commande de relais (impulsion, ouverture, fermeture) |
| paquet 31 | Exécution de macro JNIOR. Suivi d’IOException = macro absente ou nom vide |
| 00:60:35:… | Début des adresses MAC JNIOR |

- `jrmon` : colonne `8-RLYn-1`, le chiffre de gauche est le relais 8, celui de droite le relais 1. `01000000` = relais 7.
- AnalogPresets : chaque Level_N associe un relais (RelayOutputAction) à un niveau en % (Setting) sur une sortie 0-10 V. L’application surveille les relais toutes les 500 ms : une impulsion de 1000 ms suffit.
- `/flash/jnior.ini` est une copie du registre réécrite avec un délai. Après une modification, lire la clé avec `registry clé`.
- OS 4.x : peu de commandes, pas de commande pour actionner un relais. Les tests se font depuis la macro du serveur.

### Son

- Dolby CP650 : contrôle sur le port TCP 61412, MAC en 00:d0:46:…

### LMS Debian

- Volume des DCP monté sur `/opt/lms-ymagis`, DCP dans `/opt/lms-ymagis/lms` (racine FTP de lmsuser).
- Journaux FTP : `/var/log/proftpd/proftpd.log` et `xferlog`. Pas de purge automatique.
- « permission denied » côté distributeur peut cacher « No space left on device » côté serveur.

### Doremi : lire une fin de séance qui ne fait pas ce qu’il faut

- **Playlist (SPL)** : fichier XML dans `/data/playlists/`, regénéré par le TMS à chaque programmation. Il contient les **cues** (`<Action>` : nom d’une macro, avec un `Offset` en images). Le serveur ne planifie rien lui-même : « Scheduler is disabled » dans `schedulerd.log` est normal quand un TMS externe programme.
- **Macros** : `/doremi/etc/macros.xml`. Chaque macro est une liste d’actions (`Black`, `Pause`, `Lamp`, `Volume`…). `Fin_Seance` d’un site testé = `Black` puis `Pause`. Une action **Pause arrête la lecture** : les cues placés plus loin dans la playlist ne sont jamais joués.
- **Journal des ordres** : `/doremi/log/drmplaylistd.log` : `Executing macro "…"`, `Received PauseSPL`, `Received EjectSPL`, `LoadSPL(…)`, `ExecuteMacroCue("…")`. Chaque ordre reçu porte l’IP de l’émetteur entre crochets.
- **`ExecutionFailed` / `UnknownMacro`** : le serveur a reçu l’ordre d’exécuter une macro qui n’existe pas. Si ça arrive toutes les nuits à la même heure (exemple : une macro « NightMode »), c’est un défaut de configuration permanent, sans lien avec une panne ponctuelle.
- **Journal du JNIOR** : heures en GMT, l’horloge peut être décalée si la synchronisation NTP échoue. Pas de commande `time` sur le JNIOR : `cat` et `ls -l` fonctionnent.
- **Ce que ces journaux ne disent pas** : l’état réel de la lampe, du gradateur ou du projecteur. Ils prouvent une **commande reçue et exécutée**, jamais un **effet en salle**.

### Doremi : système réduit, commandes qui n’existent pas

- `sed -E` / `sed -r` : absents. Utiliser `grep`, `cut`, `sort`, `uniq`, `awk`.
- `find -newermt` : absent. Utiliser `find … -mtime -N` (jours).
- `strings -a` et `grep -a` : disponibles ; `grep -a` est nécessaire quand un journal est détecté comme binaire.
- Le format de date de `drmplaylistd.log` est `Nov  4 00:21:48 2026` (jour sur deux caractères, avec espace).
