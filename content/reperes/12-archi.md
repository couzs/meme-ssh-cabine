---
id: archi
titre: Repères ORC
groupe: Repères
intro: Rôle des bridges et du NAT 1:1.
---

### Le chemin d’une commande du TMS vers une salle

```
 TMS ──► br0 (IP virtuelle 203.0.113.41) ──► ORC : NAT 1:1 ──► br2 (IP réelle 192.0.2.42) ──► serveur de salle
 TMS ──► br1 (IP virtuelle d’ingest)     ──► ORC : NAT 1:1 ──► br3 / bond0 (réseau d’ingest)  ──► port d’ingest du serveur
                                                   │
                                                   └── br4 : sortie WAN, VPN de supervision (tun0 / tun1)
```

Quand le TMS « ne voit plus » une salle, on remonte ce chemin : l’IP virtuelle existe-t-elle (network.cfg) ? la règle NAT pointe-t-elle vers la bonne IP réelle (iptables -t nat) ? l’IP réelle répond-elle (ping, ip neigh) ?

### ORC en NAT 1:1

| Bridge | Rôle | Rôle dans netconfig.conf |
|---|---|---|
| br0 | Côté TMS : IP virtuelles de gestion (une par équipement) | iface_vmgt |
| br1 | Côté TMS : IP virtuelles d’ingest | iface_vsto |
| br2 | Réseau de gestion réel : projecteurs, serveurs, son | iface_mgt |
| br3 | Réseau d’ingest réel (bond0) | iface_sto |
| br4 | WAN / sauvegarde, passerelle par défaut | iface_bkp / iface_vgw |
| tun0 / tun1 | VPN de supervision | — |

- Vérifier les rôles sur chaque ORC avec `head -8 /etc/ferm/netconfig.conf` : iface_mgt, iface_sto, iface_vmgt, iface_vsto. Sur les ORC plus anciens, br0 est directement le réseau cabine.
- `/etc/ymagis/network.cfg` : lignes « IP virtuelle = IP réelle ». Noms DNS : sms000N = .N1 (serveur), prj000N = .N3, spr000N = .N6.
- ferm lit `/etc/ferm/netconfig.conf`, régénéré depuis network.cfg par `netconfig.pl ferm_config` (aussi appelé par set_ftp_inbox.sh).
- Les règles SNAT réécrivent la source en IP de l’ORC : deux IP virtuelles vers la même IP réelle ne posent pas de problème.
- Gestion et ingest peuvent partager le même switch : la même MAC vue sur eth1 et bond0 est normale.
- Fichiers gérés par Puppet : toute modification locale est à faire reporter par le N3.
