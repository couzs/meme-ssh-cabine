---
id: linux-essentiel
titre: L’essentiel de Linux
groupe: Apprendre
intro: 'Les briques qui reviennent dans toutes les fiches : se déplacer, lire un fichier, chercher, enchaîner des commandes, sudo.'
---

## Se déplacer et regarder

| Commande | Effet |
|---|---|
| `pwd` | affiche le dossier courant |
| `ls -lh` | liste les fichiers avec taille lisible et date |
| `ls -lt` | trie du plus récent au plus ancien |
| `cd /var/log` | va dans un dossier ; `cd ..` remonte d’un cran ; `cd` seul retourne chez toi |
| `du -sh dossier` | taille totale d’un dossier |

## Lire un fichier

| Commande | Effet |
|---|---|
| `cat fichier` | affiche tout (pour les petits fichiers) |
| `less fichier` | lecture page par page : `Espace` avance, `/mot` cherche, `q` quitte |
| `tail -n 50 fichier` | les 50 dernières lignes |
| `tail -f fichier` | suit les nouvelles lignes en direct (`Ctrl+C` pour arrêter) |
| `head -n 20 fichier` | les 20 premières lignes |

## Chercher

- `grep mot fichier` : les lignes qui contiennent « mot ».
- `grep -i` ignore les majuscules, `-v` inverse (lignes qui ne contiennent pas), `-c` compte, `-n` numérote.
- `grep -E "a|b"` : a **ou** b.
- `grep -wF 192.0.2.4` : l’adresse exacte. Sans `-F`, le point veut dire « n’importe quel caractère » ; sans `-w`, `192.0.2.4` trouverait aussi `192.0.2.41`.
- `find /dossier -iname "*motif*"` : cherche des fichiers par leur nom.

## Enchaîner des commandes

| Symbole | Effet | Exemple |
|---|---|---|
| `\|` | envoie la sortie de la commande de gauche à celle de droite | `ps aux \| grep java` |
| `;` | lance la suivante quoi qu’il arrive | `date ; df -h` |
| `&&` | lance la suivante seulement si la précédente a réussi | `apt update && apt install nmap` |
| `\|\|` | lance la suivante seulement si la précédente a échoué | `ping -c1 X \|\| echo absent` |
| `>` | écrit la sortie dans un fichier (l’écrase) | `df -h > /tmp/df.txt` |
| `2>/dev/null` | jette les messages d’erreur | `du -sh /* 2>/dev/null` |

## sudo et root

- `sudo commande` : exécute une seule commande en administrateur (ton mot de passe est demandé).
- `sudo -i` : ouvre une session root complète. L’invite passe de `$` à `#`.
- En root, Linux ne protège plus rien : une faute de frappe dans un `rm -rf` est irréversible.

## Les services (systemd)

| Commande | Effet |
|---|---|
| `systemctl status NOM` | état et dernières lignes de log |
| `systemctl is-active NOM` | répond juste active / inactive / failed |
| `sudo systemctl restart NOM` | redémarre |
| `journalctl -u NOM -n 50` | les 50 dernières lignes de log du service |

Sur les machines anciennes, certains services se pilotent par `/etc/init.d/NOM status|start|stop|restart`.
