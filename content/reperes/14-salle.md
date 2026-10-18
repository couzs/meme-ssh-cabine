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
