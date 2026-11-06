---
id: barco
titre: Repères Barco
groupe: Repères
intro: Ports, MAC, ICMP-X et pièges connus.
---

### Ports et adresses

| Port / valeur | Usage |
|---|---|
| 43728 | Projecteur : Barco Communicator |
| 43758 | IMS / ICMP : API utilisée par le TMS |
| 80 / 443 | Interface web (Web Commander) |
| 22 | SSH (présent sur certains modèles) |
| 00:04:a5:… | Début des adresses MAC Barco |

### Série 2 (DP2K / DP4K) avec IMS ou ICMP Alchemy

- Projecteur et IMS Alchemy partagent la même IP de gestion.
- Aucune IP d’usine documentée : la config réseau est sur la carte Cinema Controller.
- Revenu sur une autre IP après une coupure : refaire la config réseau dans Communicator. Si ça se reproduit, ticket Barco avec un package de diagnostic.
- Communicator ne trouve pas un projecteur hors de son réseau : saisir l’IP à la main.

### Série 4 (SP4K) avec ICMP-X

- Web Commander → Network interfaces : Projector (IP de gestion), ICMP (LAN 1) et ICMP (LAN 2).
- Dans le TMS, PRJ et SMS ont la même IP de gestion (celle du projecteur). L’IP d’ingest est celle d’un port ICMP.
- L’IP d’ingest doit être sur un port ICMP réellement câblé. Un port en Automatic sans serveur DHCP reste sans IP.
- Remplacement d’un DCP2000 : penser à brancher le port ICMP sur le switch d’ingest et à débrancher l’ancien serveur.
- Alertes DEVICE_OFFLINE la nuit = projecteurs éteints, normal.

### Package de diagnostic (SP2K, Alchemy ICMP)

- Un fichier `.zip` nommé `diagnostic-<modèle>-<série>-<date>`. Dossiers : `mediaplayer` (journaux du lecteur, lisibles), `notifications` (événements du projecteur, lisibles), `config`, `log`, `history`, `system`, `statistics` (chiffrés), `capture` (image de l’écran), `device-status.json`, `device-identification.json`.
- Les fichiers **`*.gz.enc`** sont chiffrés (`openssl` avec mot de passe). La clé `encryption.key` est faite pour le constructeur : on ne les ouvre pas, on les transmet à Barco.
- **`mediaplayer/ICMPSyslog.txt`** : le journal utile. Une ligne par événement : lecture de playlist, `|CUE|` (avec l’origine `[SHOW]` ou `[USER:…]`), `SHOW-START`, `SHOW-END`, `CUE-SKIPPED`, actions envoyées aux équipements (`Executing action ["<équipement>" "Send Text"(…)]`), connexions distantes (`Login attempt from`, `login(…)`, `triggerCue(…)`).
- Heures en **UTC**. Le fichier couvre environ un mois.
- Les noms d’équipement entre guillemets (PAA, CP950, PROJECTOR, TMS MONITORING…) sont ceux déclarés dans le lecteur. `TMS MONITORING` « device not supported - device ignored » est un bruit habituel.
- Le projecteur n’enregistre pas l’éclairage de la salle : la lumière est commandée par un contrôleur externe vu comme une action `Send Text` dans le journal du lecteur.
- Un cue manuel laisse : `Login attempt`, `login(…, "<nom du client>")`, `triggerCue("…")`, `logout(…)`, et l’adresse IP de l’émetteur. Le **nom du client** (ex. « TMS … ») est celui que le logiciel se donne, pas une preuve.
