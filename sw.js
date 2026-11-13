/* Service worker : mode hors ligne simple.
   - Fichiers de l’application : réseau d’abord (donc toujours à jour quand tu es en ligne), cache en secours.
   - data.json, API GitHub, services de cartes et d’itinéraires : jamais mis en cache ici. */
const VERSION='tp-2.0.0';
const SHELL=[
 "./",
 "css/style.css",
 "icons/icon-180.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "index.html",
 "js/app.js",
 "js/budget.js",
 "js/chat.js",
 "js/checklist.js",
 "js/config.js",
 "js/elevation.js",
 "js/github.js",
 "js/home.js",
 "js/lib/geo.js",
 "js/lib/money.js",
 "js/lib/poi.js",
 "js/lib/stage.js",
 "js/lib/util.js",
 "js/lodging.js",
 "js/main.js",
 "js/map.js",
 "js/mapcore.js",
 "js/names.js",
 "js/poi.js",
 "js/recap.js",
 "js/routing.js",
 "js/stages.js",
 "js/state.js",
 "js/store.js",
 "js/transmap.js",
 "js/transports.js",
 "js/trip.js",
 "js/ui.js",
 "js/weather.js",
 "manifest.webmanifest",
 "vendor/leaflet/LICENSE",
 "vendor/leaflet/images/layers-2x.png",
 "vendor/leaflet/images/layers.png",
 "vendor/leaflet/images/marker-icon-2x.png",
 "vendor/leaflet/images/marker-icon.png",
 "vendor/leaflet/images/marker-shadow.png",
 "vendor/leaflet/leaflet.css",
 "vendor/leaflet/leaflet.js"
];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||/data\.json$/.test(u.pathname))return;
 e.respondWith(fetch(e.request).then(r=>{
  if(r.ok){const c=r.clone();caches.open(VERSION).then(ch=>ch.put(e.request,c))}
  return r;
 }).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
});
