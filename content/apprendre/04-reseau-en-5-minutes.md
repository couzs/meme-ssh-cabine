---
id: reseau-en-5-minutes
titre: Le réseau en 5 minutes
groupe: Apprendre
intro: 'IP, masque, passerelle, MAC, port, NAT : les notions qu’il faut pour lire les procédures réseau et comprendre ce que fait l’ORC.'
---

## Adresse IP et réseau

- Une **IP** (ex. `192.0.2.41`) identifie un équipement sur le réseau.
- Le **masque** `/24` (255.255.255.0) dit que les trois premiers nombres désignent le réseau : `192.0.2.41` et `192.0.2.13` sont dans le même réseau, ils se parlent directement.
- Pour joindre un autre réseau, un équipement passe par sa **passerelle** (gateway). En cabine, c’est l’ORC.

## MAC : la plaque d’immatriculation

- Chaque carte réseau a une **adresse MAC** fixe (ex. `00:04:a5:12:34:56`). Les trois premiers octets désignent le **fabricant**.
- C’est pour ça que `ip neigh` est si utile : même si l’IP est fausse, la MAC dit qui est là.

| Début de MAC | Fabricant |
|---|---|
| `00:04:a5` | Barco |
| `00:60:35` | JNIOR (INTEG) |
| `00:d0:46` | Dolby |
| `00:25:90`, `00:30:48`, `ac:1f:6b` | Supermicro (serveurs) |

## ARP : « qui a cette IP ? »

Avant de parler à une IP de son réseau, une machine crie « **who-has** 192.0.2.41 ? ». Le propriétaire répond « **is-at** 00:04:a5:… ». C’est ce qu’on voit dans `tcpdump arp` :

- des « who-has » sans réponse = personne n’a cette IP ;
- deux MAC différentes qui répondent pour la même IP = **conflit d’adresse**.

## Ports : les portes d’entrée

Une machine joignable (ping OK) peut avoir des services arrêtés. Chaque service écoute sur un **port** :

| Port | Service |
|---|---|
| 22 | SSH |
| 21 | FTP |
| 23 | Telnet (JNIOR) |
| 80 / 443 | Interfaces web |
| 8080 | Interface TMS (Tomcat) |
| 27017 | Base Mongo du TMS |
| 43728 | Barco Communicator |
| 43758 | API IMS / ICMP (TMS ↔ serveur Barco) |
| 61412 | Pilotage Dolby CP650 |
| 9200 | Protocole JNIOR (serveur ↔ JNIOR) |

« Connection refused » = la machine répond mais le port est fermé ; « timed out » = pas de réponse du tout.

## NAT 1:1 : ce que fait l’ORC

Le TMS ne parle jamais directement aux salles. Il parle à des **IP virtuelles** ; l’ORC les traduit en **IP réelles** :

```
TMS → 203.0.113.41 (virtuelle) → ORC → 192.0.2.42 (réelle, en salle)
```

La table de correspondance est dans `/etc/ymagis/network.cfg`. Quand un équipement est remplacé et change d’IP, c’est cette correspondance qu’il faut corriger (procédure « Corriger l’IP réelle d’une salle dans le NAT »).

## Gestion et ingest : deux réseaux

- **Gestion** : pilotage des équipements (projecteurs, serveurs, son, JNIOR). Peu de trafic.
- **Ingest** : copie des films vers les serveurs de salle. Très gros débit, souvent sur un bond (plusieurs câbles agrégés).

Un serveur de salle a une IP dans chacun des deux réseaux.
