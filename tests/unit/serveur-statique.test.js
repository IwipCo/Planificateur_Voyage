/* Simule GitHub Pages : sert le dossier tel quel en HTTP et vérifie que tout le graphe d'import se télécharge (types MIME inclus). */
import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
test('index.html, modules, CSS, Leaflet, icônes et manifeste se téléchargent sans 404',async()=>{
 const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]),p=path.join(ROOT,u==='/'?'index.html':u);
  if(!p.startsWith(ROOT)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end()}
  r.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r)});
 await new Promise(r=>srv.listen(0,r));const base='http://127.0.0.1:'+srv.address().port+'/';
 try{
  const get=async u=>{const r=await fetch(base+u);assert.equal(r.status,200,'404 : '+u);return r};
  const html=await(await get('')).text();
  const assets=[...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>m[1]).filter(u=>!/^(https?:|data:)/.test(u));
  for(const a of assets)await get(a);
  const seen=new Set(),queue=['js/main.js'];
  while(queue.length){const f=queue.shift();if(seen.has(f))continue;seen.add(f);
   const r=await get(f);assert.match(r.headers.get('content-type'),/javascript/,'type MIME de '+f);
   const s=await r.text();for(const m of s.matchAll(/from\s+'(\.[^']+)'/g))queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(f),m[1])));
  }
  assert.ok(seen.size>=28,'modules téléchargés : '+seen.size);
  const man=await(await get('manifest.webmanifest')).json();for(const i of man.icons)await get(i.src);
  await get('sw.js');
 }finally{srv.close()}
});
