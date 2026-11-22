/* Intégrité du site : fichiers référencés, imports, cache hors ligne, absence de dépendances externes bloquantes. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const rd=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const walk=(d,acc=[])=>{for(const f of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const p=path.join(d,f.name);f.isDirectory()?walk(p,acc):acc.push(p)}return acc};
test('index.html : toutes les ressources locales existent',()=>{
 const h=rd('index.html');const refs=[...h.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>m[1]).filter(u=>!/^(https?:|data:)/.test(u));
 assert.ok(refs.length>=6);refs.forEach(r=>assert.ok(fs.existsSync(path.join(ROOT,r)),'manquant : '+r));
});
test('index.html : charge Leaflet en local puis le module principal',()=>{
 const h=rd('index.html');assert.ok(h.indexOf('vendor/leaflet/leaflet.js')<h.indexOf('js/main.js'));assert.match(h,/type="module"/);
 assert.ok(!/cdnjs|unpkg|jsdelivr/.test(h),'aucun CDN');
});
test('modules : tous les imports relatifs pointent vers un fichier existant et exportent ce qu’on leur demande',()=>{
 const files=walk('js').filter(f=>f.endsWith('.js'));assert.ok(files.length>=25);
 const exportsOf=f=>{const s=rd(f);return new Set([...s.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/g)].map(m=>m[1]))};
 for(const f of files){
  const s=rd(f);
  for(const m of s.matchAll(/import\s+(?:\*\s+as\s+\w+|\{([^}]*)\})\s+from\s+'([^']+)'/g)){
   const target=path.join(path.dirname(f),m[2]);assert.ok(fs.existsSync(path.join(ROOT,target)),f+' -> '+m[2]);
   if(m[1]){const ex=exportsOf(target);m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach(n=>assert.ok(ex.has(n),`${f} importe « ${n} » absent de ${target}`))}
  }
 }
});
test('modules lib/ : purs (aucun import hors lib/, aucun accès au DOM)',()=>{
 for(const f of walk('js/lib')){const s=rd(f);for(const m of s.matchAll(/from\s+'([^']+)'/g))assert.ok(/^\.\/[^/]+\.js$/.test(m[1]),f+' importe '+m[1])}
 for(const f of ['js/lib/geo.js','js/lib/stage.js','js/lib/money.js','js/lib/poi.js']){const s=rd(f);assert.ok(!/document\.|window\.|localStorage|querySelector/.test(s),f+' touche au navigateur')}
});
test('service worker : met en cache tous les fichiers de l’appli',()=>{
 const sw=rd('sw.js');const list=JSON.parse(sw.match(/const SHELL=(\[[\s\S]*?\]);/)[1]);
 const expected=walk('.').filter(f=>!/^(node_modules|tests|package|sw\.js|README|\.)/.test(f)).filter(f=>!f.endsWith('data.json')).map(f=>f.replace(/\\/g,'/'));
 for(const f of expected)assert.ok(list.includes(f),'absent du cache : '+f);
 for(const f of list)if(f!=='./')assert.ok(fs.existsSync(path.join(ROOT,f)),'fichier du cache introuvable : '+f);
});
test('manifest : icônes présentes, démarrage relatif',()=>{
 const m=JSON.parse(rd('manifest.webmanifest'));assert.equal(m.start_url,'./');m.icons.forEach(i=>assert.ok(fs.existsSync(path.join(ROOT,i.src)),i.src));
});
test('aucun gestionnaire d’événement en ligne (onclick=…) dans le HTML',()=>{assert.ok(!/\son(click|change|input)="/.test(rd('index.html')))});
test('le fichier de données de l’utilisateur n’est pas livré avec le site',()=>{assert.ok(!fs.existsSync(path.join(ROOT,'data.json')))});
