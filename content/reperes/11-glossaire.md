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
| Puppet | Outil qui impose la configuration des machines : une modification locale peut être écrasée. |
| N3 | Support niveau 3 : à solliciter pour toute modification d’un fichier géré par Puppet. |
