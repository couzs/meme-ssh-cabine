---
id: baie-ymagis
titre: Repères baie Ymagis
groupe: Repères
intro: 'Schéma type d’une baie Ymagis : adresses, ports du switch, fabricant d’après la MAC, serveur Dell, Smarty.'
---

Schéma type, réseau de contrôle noté **10.x.y**. Les adresses peuvent varier d’un site à l’autre : à confirmer sur place.

### Adresses du réseau de contrôle

| Adresse | Équipement |
|---|---|
| .254 | Passerelle : Soekris (ancien) ou ORC (récent) |
| .2 | Switch de baie, côté Soekris (port 1) |
| .3 | DRAC du serveur TCS |
| .4 | TCS (Br0) |
| .5 | YMS |
| .9 | YFS |
| .231 / .232 / .233 | TMS Doremi / CDS / Dvidea |
| .N1 / .N3 / .N6 | Salle N : serveur (SMS), projecteur, SPR. Salle 1 = .11, .13, .16 |
| .240 | Poste de gestion (Management Workstation) |

- Réseau de stockage (ingest) : 192.168.168.x. Le TCS y est en .4 (bonding), le YFS en .9, les TMS en .231 à .233, le serveur de la salle N en .N1, le poste de gestion en .240.
- Domaine ymagis.net. Sur les sites équipés d’un ORC, le TMS peut être un conteneur de l’ORC : il tombe avec lui.

### Ports du switch de baie

| Port | Câble |
|---|---|
| 1 | Soekris (vert) |
| 2 | DRAC |
| 3 à 10 | Serveur TCS (bridges et cartes réseau) |
| 13 / 15 / 17 | Stockage vers les salles 1 / 2 / 3 (jaune) |
| 14 / 16 / 18 | Contrôle vers le switch de chaque salle |
| 24 | Poste de gestion |

Ports 1 à 10 tous éteints = serveur et passerelle sans lien réseau. Allumés mais rien ne répond = serveur figé ou qui ne démarre pas.

### Fabricant d’après le début de la MAC

| Début de MAC | Fabricant |
|---|---|
| 00:04:a5 | Barco |
| 00:d0:46 | Dolby |
| 00:60:35 | JNIOR (INTEG) |
| 04:5d:4b | Sony |
| 90:09:d0 | Synology (LMS) |
| b8:27:eb | Raspberry Pi |
| 5c:26:0a | Dell (switch, serveur ou DRAC) |
| 00:25:90 / 00:30:48 / ac:1f:6b | Supermicro |
| 70:b3:d5 | Bloc IEEE partagé (petit fabricant) : identifier par les ports |

### Serveur Dell sur site

- F2 = BIOS, F11 = menu de démarrage, souvent protégés par mot de passe : ne pas contourner, demander au N3.
- Faire photographier l’écran en fin de démarrage sans toucher au clavier. « No boot device » = disque non vu ; message du contrôleur RAID = ne rien valider, photo au N3.
- Le DRAC répond même si le système est planté, tant que le serveur est alimenté. DRAC muet + serveur allumé = DRAC non câblé ou panne plus grave.

### Smarty

- Interface : `http://{SMARTY}:8080/tms-ymagis-smarty/` (renseigner SMARTY dans « Mon site »). YMS : `<codesite>yms0001.ymagis.net`.
- `/var/www/dashboard.xml` : réécrit toutes les 0 à 5 s.
- `/tmp/smarty-*.log` : journaux.
- `/etc/ymagis/smarty_theater_config.xml` : salles, généré par Puppet depuis Sarah.
- `/etc/ymagis/smartydb/` : bases, reconstruites au démarrage.
