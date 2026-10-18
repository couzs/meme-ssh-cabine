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
