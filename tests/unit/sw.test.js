/* Service worker : exécuté dans un bac à sable avec de faux caches. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
function load(){
 const code=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),handlers={},store=new Map(),log=[];
 const cache={addAll:async l=>{l.forEach(x=>store.set(x,'v'));log.push('addAll '+l.length)},put:async(r,x)=>{store.set(r.url,x)},match:async r=>store.get(typeof r==='string'?r:r.url)};
 const sb={URL,Promise,console,location:{origin:'https://u.github.io'},
  caches:{open:async()=>cache,keys:async()=>['ancien','tp-2.0.0'],delete:async k=>{log.push('delete '+k)},match:async r=>cache.match(r)},
  self:{addEventListener:(t,f)=>handlers[t]=f,skipWaiting:async()=>log.push('skip'),clients:{claim:async()=>log.push('claim')}},fetch:null};
 sb.addEventListener=sb.self.addEventListener;vm.createContext(sb);vm.runInContext(code,sb);return{sb,handlers,store,log};
}
const req=(url,method='GET')=>({url,method,clone(){return this}});
test('installation : met en cache tous les fichiers puis prend le contrôle',async()=>{
 const {handlers,log}=load();let p;handlers.install({waitUntil:x=>p=x});await p;assert.ok(log.some(l=>/addAll \d+/.test(l)));
 let q;handlers.activate({waitUntil:x=>q=x});await q;assert.ok(log.includes('delete ancien')&&log.includes('claim'));
});
test('fetch : ignore data.json, les requêtes non GET et les autres origines',()=>{
 const {handlers}=load();let called=0;
 for(const r of [req('https://u.github.io/voyage/data.json'),req('https://u.github.io/voyage/js/main.js','POST'),req('https://api.github.com/repos/x'),req('https://tile.opentopomap.org/1/2/3.png')])handlers.fetch({request:r,respondWith:()=>called++});
 assert.equal(called,0);
});
test('fetch : réseau d’abord, cache en secours hors ligne',async()=>{
 const t=load();t.sb.fetch=async()=>({ok:true,clone(){return this},body:'réseau'});
 let out;t.handlers.fetch({request:req('https://u.github.io/voyage/js/main.js'),respondWith:p=>out=p});assert.equal((await out).body,'réseau');
 await new Promise(r=>setTimeout(r,10));
 t.sb.fetch=async()=>{throw new Error('hors ligne')};
 t.handlers.fetch({request:req('https://u.github.io/voyage/js/main.js'),respondWith:p=>out=p});assert.equal((await out).body,'réseau','servi depuis le cache');
});
