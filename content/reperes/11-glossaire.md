---
id: glossaire
titre: Glossaire
groupe: Repères
intro: Les mots du métier en une ligne, pour lire les procédures sans se perdre.
---

| Terme | En clair |
|---|---|
| TMS | Serveur central du cinéma : planning, playlists, KDM, supervision des salles. |
| LMS / TCS | Bibliothèque centrale des films (DCP). TCS = version Ubuntu avec extra_exchange ; LMS Debian = dépôt FTP simple. |
| ORC | Routeur du site : relie le TMS aux salles par du NAT 1:1 et porte les réseaux de gestion et d’ingest. |
| Serveur de salle | Lit le film en salle : Doremi (DCP2000, ShowVault, IMS) ou Barco (ICMP, ICMP-X). |
| DCP | Le film livré : un dossier avec des MXF (image, son) et des XML qui les décrivent. |
| MXF | Fichiers lourds du DCP : image (j2c) et son (pcm). |
| CPL | Composition PlayList : la « recette » du film, quels MXF jouer et dans quel ordre. |
| PKL | Packing List : liste des fichiers avec leur taille et leur hash. Sert à vérifier le DCP. |
| ASSETMAP | Plan du DCP : où se trouve chaque fichier. |
| KDM | Clé de déchiffrement d’un film, valable pour un serveur et une période. |
| Ingest | Copie d’un DCP vers le serveur de salle, avec vérification contre la PKL. |
| Hash | Empreinte d’un fichier. Un octet modifié = un hash différent. |
| CRLF | Fin de ligne Windows. Ajoutée par un FTP en mode ASCII, elle abîme les XML d’un DCP. |
| JNIOR | Boîtier d’automation : relais et sorties 0-10 V qui pilotent lumière, rideaux, masquage. |
| Macro / cue | Macro = action enregistrée sur le serveur. Cue = déclenchement de la macro à un moment du film. |
| NAT 1:1 | Traduction d’adresse : une IP virtuelle côté TMS correspond à une IP réelle en salle. |
| Bridge (br0…br4) | Pont réseau de l’ORC : regroupe des ports physiques en un seul réseau logique. |
| Bond (bond0) | Plusieurs câbles réseau agrégés en un seul lien, plus rapide et avec secours. Utilisé pour l’ingest. |
| MAC | Adresse matérielle d’une carte réseau. Ses 3 premiers octets désignent le fabricant (00:04:a5 = Barco). |
| ARP | Mécanisme « qui a cette IP ? » : relie une IP à une MAC. |
| DHCP | Attribution automatique d’une IP. En cabine, les équipements sont en IP fixe ; « Automatic » sans serveur DHCP = pas d’IP. |
| SNMP | Protocole de supervision : le TMS et le monitoring lisent l’état des équipements. |
| SSH | Connexion sécurisée à une machine distante, en ligne de commande (PuTTY, Windows Terminal). |
| Tunnel SSH (-L) | Redirection de port à travers une connexion SSH : un port de ton poste est relié, via le TMS, à un équipement du cinéma (interface web d’un NAS, SSH d’un NAS). Voir « Le tunnel SSH expliqué ». |
| Rebond SSH (-J) | « Jump host » : ssh se connecte d’abord à une machine relais (le TMS) puis rebondit vers l’équipement cible, en une seule commande. |
| QNAP / QTS | NAS de marque QNAP et son système QTS. Interface web sur les ports 8080 (HTTP) et 443 (HTTPS), SSH sur le port 22 s’il est activé. |
| root / sudo | root = administrateur Linux ; sudo = exécuter une commande en administrateur. |
| IMAP | Protocole de lecture des mails : le TMS relève ainsi la boîte KDM. |
| FTP (ASCII / binaire) | Transfert de fichiers. Toujours en binaire pour un DCP ou un .jnior : le mode ASCII modifie les fins de ligne. |
| Puppet | Outil qui impose la configuration des machines : une modification locale peut être écrasée. |
| N3 | Support niveau 3 : à solliciter pour toute modification d’un fichier géré par Puppet. |
| YMS | Serveur Ymagis du site. Héberge Smarty sur certains sites ; sur d’autres, Smarty est dans le Tomcat du TMS. |
| Smarty | Tableau de bord de supervision des salles. Sur le YMS : poller et fichier dashboard.xml. Sur le TMS : application Tomcat tms-ymagis-smarty, sans service à elle. |
| Sarah | Référentiel où sont déclarés le site et ses salles. Puppet s’en sert pour générer la configuration Smarty. |
| Soekris | Petit routeur des anciennes baies Ymagis : passerelle .254, reliée au modem. Remplacé par l’ORC sur les sites récents. |
| DRAC / iDRAC | Carte d’administration à distance d’un serveur Dell : état matériel, RAID, console. Répond même si le système est planté. |
| OpenVPN / tun | Tunnel chiffré de l’ORC vers Ymagis. L’interface tun (tun1…) reste présente même si la liaison est tombée : il faut vérifier le trafic. |
| ping-restart | Redémarrage automatique d’OpenVPN quand le serveur ne répond plus. Visible dans le journal comme « Inactivity timeout ». |
| POS | Système de billetterie du cinéma. Des plugins du TMS lui demandent films et séances. |
| Tomcat | Serveur d’applications Java du TMS : interface web, plugins et Smarty (sur certains sites) tournent dedans. Le redémarrer coupe tout le TMS. |
| POST | Auto-test au démarrage d’un PC ou d’un serveur, avant le système. BIOS affiché = POST passé. |
