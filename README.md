# Carnet de route — v2

Application de planification de voyages et de randonnées (jours, tracés, hébergements, trajets, budget, checklist, points d’intérêt…).
**Aucune étape de build** : ce sont des fichiers statiques, publiés tels quels par GitHub Pages.

## Déploiement (inchangé)
1. Copie **tout le contenu de ce dossier** à la racine de ton dépôt (hors `node_modules/`).
2. **Ne remplace pas ton `data.json`** : il est compatible, l’appli le relit tel quel (ce fichier n’est volontairement pas livré).
3. GitHub Pages sur la branche principale : l’adresse reste la même.
4. Dans l’appli, ⚙ : propriétaire, dépôt, token. Le format de `data.json` n’a pas changé.

## Organisation
```
index.html               structure de la page (coquille HTML)
css/style.css            styles
js/main.js               point d’entrée : charge les modules, branche les écouteurs
js/state.js              état partagé (objet S)
js/store.js, github.js   chargement, fusion, migration, enregistrement (un seul data.json)
js/mapcore.js, map.js    carte Leaflet, fonds, calques, dessin et édition des points
js/routing.js            itinéraires (piéton / voiture / tronçons forcés)
js/elevation.js          dénivelé et profil
js/poi.js                points d’intérêt (chargement par tronçons en arrière-plan)
js/stages.js lodging.js transports.js budget.js checklist.js recap.js chat.js weather.js …
js/home.js trip.js app.js   accueil, configuration du voyage, rendu global
js/lib/*.js              logique pure, sans DOM (géométrie, stats d’un jour, argent, POI, utilitaires)
vendor/leaflet/          Leaflet 1.9.4 hébergé avec l’appli (plus de dépendance à un CDN)
sw.js                    service worker : l’appli s’ouvre aussi hors ligne
manifest.webmanifest     icône et installation sur l’écran d’accueil
icons/                   icônes
tests/                   tests automatiques (unitaires + parcours complets)
```
Les modules `js/lib/` n’utilisent ni le navigateur ni Leaflet : ils sont testés directement avec Node.

## Mises à jour
Le service worker essaie toujours le réseau d’abord : une nouvelle version publiée s’affiche dès le rechargement
quand tu es en ligne ; le cache ne sert qu’hors ligne. Si tu ajoutes ou renommes un fichier, mets à jour la liste `SHELL` de `sw.js`
(le test « service worker » te le signale).

## Tests (facultatif, sur ton ordinateur)
```
npm install
npm test          # unitaires + parcours complets simulés (jsdom)
```
