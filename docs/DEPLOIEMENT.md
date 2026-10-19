# Mise en ligne

Le mémo est un site statique : un seul fichier `index.html` construit par `npm run build`. On l’héberge sur **Cloudflare Pages** (gratuit), relié au dépôt GitHub, et on en réserve l’accès à l’équipe avec **Cloudflare Access** (gratuit jusqu’à 50 utilisateurs).

Résultat : chaque modification enregistrée sur GitHub est en ligne en une à deux minutes, et seules les adresses e-mail autorisées peuvent ouvrir le mémo.

## 1. Cloudflare Pages

1. Tableau de bord Cloudflare → **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. Autoriser GitHub et choisir le dépôt `meme-ssh-cabine`.
3. Réglages de build :
   - Framework preset : **None**
   - Build command : **`npm run build`**
   - Build output directory : **`dist`**
   - Variable d’environnement : `NODE_VERSION` = `22`
4. **Save and Deploy**. Le site est en ligne sur `https://memo-ssh-cabine.pages.dev` (ou un nom proche).

Chaque commit sur `main` redéploie automatiquement. Si le contenu est invalide, le build échoue et la version précédente reste en ligne.

Domaine personnalisé (facultatif) : dans le projet Pages → **Custom domains** → ajouter par exemple `memo.mondomaine.fr`.

### Variante : projet Cloudflare Workers (Workers Builds)

Si le projet a été créé dans **Workers** (commande de déploiement `npx wrangler deploy`) et non dans Pages, le fichier `wrangler.jsonc` à la racine du dépôt dit à Cloudflare de publier le dossier `dist/`. Sans lui, le déploiement échoue et le site reste sur l’ancienne version. Le champ `name` doit être identique au nom du projet dans Cloudflare.

## 2. Réserver l’accès à l’équipe (Cloudflare Access)

Le mémo ne contient aucune donnée de site, mais il décrit l’infrastructure : il ne doit pas être public.

1. Tableau de bord Cloudflare → **Zero Trust** (créer l’organisation au premier accès, offre Free).
2. **Access** → **Applications** → **Add an application** → **Self-hosted**.
3. Nom : `Mémo SSH Cabine`. Domaine : celui du site (`memo-ssh-cabine.pages.dev`, et le domaine personnalisé s’il existe).
4. Politique : **Allow**, règle **Include** → **Emails ending in** `@votre-societe.fr` (ou **Emails** pour une liste nominative).
5. Méthode de connexion : **One-time PIN** (code reçu par e-mail, rien à installer), ou le compte Google / Microsoft de l’entreprise si vous l’avez relié.
6. Durée de session : 24 h ou une semaine selon votre préférence.

Dans le projet Pages → **Settings** → **General**, activer aussi la protection des **déploiements de prévisualisation** (preview).

Pour ajouter ou retirer quelqu’un : modifier la politique Access, sans toucher au site.

## 3. Qui peut modifier

- Les membres de l’équipe qui doivent corriger le contenu : les inviter comme collaborateurs du dépôt GitHub (Settings → Collaborators).
- Pour garder la main : protéger la branche `main` (Settings → Branches) et demander une *pull request* relue avant publication. Le lien « Proposer une correction » propose alors automatiquement une pull request aux personnes qui n’ont pas le droit d’écrire directement.

## 4. Mises à jour vues par les utilisateurs

- L’application vérifie toutes les 5 minutes (et à chaque retour sur l’onglet) si une nouvelle version est en ligne, et affiche un bandeau **Recharger**.
- Les nouveautés de `content/nouveautes.yaml` apparaissent dans le bouton **Nouveautés** (pastille rouge tant qu’on ne les a pas lues).
- Hors ligne, le mémo déjà ouvert reste utilisable (cache du navigateur), et la version `memo-ssh-cabine.html` téléchargeable en pied de page fonctionne sans connexion.

## 5. Ce qui est stocké où

| Donnée | Où |
|---|---|
| Commandes, procédures, guides | dépôt GitHub (contenu public pour l’équipe, aucune donnée de site) |
| IP et profils de sites | coffre chiffré dans le navigateur de chaque technicien (AES-256, clé dérivée de son mot de passe) |
| Favoris, thème, affichage | stockage local du navigateur |
| Connexions | Cloudflare Access (journal des accès dans Zero Trust → Logs) |
