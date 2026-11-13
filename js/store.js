/* Chargement, fusion, migration et enregistrement des voyages dans un seul fichier. */
import {C} from './config.js';
import {S} from './state.js';
import {ghGet, ghPut, hasGh} from './github.js';
import {em} from './lib/util.js';
import {status, toast} from './ui.js';
import {scheduleNames} from './names.js';
import {renderChat} from './chat.js';
import {renderHome} from './home.js';
import {openSet} from './trip.js';
import {renderAll} from './app.js';

export function norm(d){
 d.stages=d.stages||[];d.messages=d.messages||[];d.participants=Array.isArray(d.participants)&&d.participants.length?d.participants:['Moi'];
 d.start=d.start||'';d.end=d.end||'';d.title=d.title||'';d.transports=d.transports||[];d.homes=d.homes||{};d.checklist=d.checklist||[];d.pois=d.pois||[];d.tabsOff=d.tabsOff||[];d.poiCov=d.poiCov||{};d.pois.forEach(x=>{if(x.type==='food')x.type='resto';if(x.type==='shelter')x.type='camp'});d.spend=d.spend||[];d.payments=d.payments||[];
 d.stages.forEach(s=>{s.points=Array.isArray(s.points)?s.points:[];const L=s.lodging=s.lodging||{name:'',address:'',price:'',status:'find'};if(!L.status)L.status=L.booked?'booked':'find';delete L.booked;L.nights=L.nights||1});
}
export function wrap(d){
 if(d&&Array.isArray(d.trips))return d;
 if(d&&Array.isArray(d.stages)){d.id=d.id||'legacy';return{version:2,trips:[d]}}
 return{version:2,trips:[]};
}
export const deleted=new Set();
export const touched=new Set();
export const createdLocal=new Set();
export async function loadAll(){
 S.ALL={version:2,trips:[]};S.allSha=null;S.loaded=false;S.loadErr='';
 let migrated=false;
 if(hasGh()){
  try{const r=await ghGet(C.path);S.ALL=wrap(r.data);S.allSha=r.sha;S.loaded=true;if(!Array.isArray(r.data.trips))migrated=true}
  catch(e){if(e.message==='404')S.loaded=true;else S.loadErr='Lecture de '+C.path+' impossible ('+em(e)+')'}
  if(S.loaded&&!S.ALL.migrated){
   try{
    const ix=await ghGet(C.dir+'/index.json');
    for(const m of ix.data.trips||[]){
     if(m.file===C.path||S.ALL.trips.some(t=>t.id===m.id))continue;
     try{const r=await ghGet(m.file||C.dir+'/'+m.id+'.json');r.data.id=m.id;S.ALL.trips.push(r.data);migrated=true}catch(e){}
    }
   }catch(e){}
   if(migrated)S.ALL.migrated=true;
  }
 }
 if(!S.loaded){
  try{const r=await fetch(C.path+'?t='+Date.now());if(r.ok){S.ALL=wrap(await r.json());if(!hasGh())S.loaded=true}}catch(e){}
 }
 S.ALL.trips.forEach(t=>norm(t));
 if(migrated&&hasGh()&&S.loaded){
  try{S.allSha=await ghPut(C.path,S.ALL,S.allSha,'Regroupement de tous les voyages dans un seul fichier');toast('Tous tes voyages sont maintenant regroupés dans '+C.path+'.')}
  catch(e){S.loadErr='Regroupement non enregistré ('+em(e)+')';S.dirty=true}
 }
}
export function mergeList(a,b){const ids=new Set(a.map(m=>m.id));b.forEach(m=>{if(!ids.has(m.id))a.push(m)});a.sort((x,y)=>x.ts-y.ts)}
export function mergeMsgs(rt,lt){
 lt=lt||S.D;
 mergeList(lt.messages,rt.messages||[]);
 (rt.stages||[]).forEach(rs=>{const s=lt.stages.find(x=>x.id===rs.id);if(s&&rs.chat&&rs.chat.length){s.chat=s.chat||[];mergeList(s.chat,rs.chat)}});
}
export function mergeAll(rem){
 const loc=new Map(S.ALL.trips.map(t=>[t.id,t])),out=[];
 rem.trips.forEach(rt=>{
  if(deleted.has(rt.id))return;
  const lt=loc.get(rt.id);
  if(!lt){norm(rt);out.push(rt);return}
  if(touched.has(rt.id)||rt.id===S.curId){mergeMsgs(rt,lt);out.push(lt)}else{norm(rt);out.push(rt)}
  loc.delete(rt.id);
 });
 loc.forEach(lt=>{if(!deleted.has(lt.id)&&createdLocal.has(lt.id))out.push(lt)});
 S.ALL.trips=out;
 if(S.curId)S.D=out.find(t=>t.id===S.curId)||S.D;
}
export async function save(){
 if(!hasGh()){openSet();return toast('Renseigne le token GitHub pour enregistrer.')}
 if(!S.loaded)return toast('Le fichier de données n’a pas pu être lu : enregistrement bloqué pour ne rien écraser.');
 status('Enregistrement…');
 try{
  let rem=null,rs=null;
  try{const r=await ghGet(C.path);rem=r.data;rs=r.sha}catch(e){if(e.message!=='404')throw e}
  if(rem&&rs!==S.allSha)mergeAll(wrap(rem));
  S.allSha=await ghPut(C.path,S.ALL,rs,'Voyages mis à jour par '+(C.me||'?'));
  touched.clear();createdLocal.clear();S.dirty=false;status('✓ Enregistré');renderChat();
 }catch(e){status('⚠ Échec');toast('Enregistrement impossible (erreur '+em(e)+'). Vérifie le token et le dépôt.')}
}
export function markDirty(){S.dirty=true;status('● Non enregistré');if(S.curId)touched.add(S.curId)}
export function changed(){markDirty();scheduleNames()}
export async function refresh(manual){
 if(!hasGh())return manual&&toast('Token GitHub requis pour actualiser.');
 if(S.dirty&&!manual)return;
 try{
  const r=await ghGet(C.path);
  if(r.sha===S.allSha)return manual&&toast('Déjà à jour.');
  const rem=wrap(r.data);
  if(S.dirty){mergeAll(rem);S.allSha=r.sha;toast('Modifications des autres récupérées ; les tiennes restent à enregistrer.')}
  else{
   S.ALL=rem;S.ALL.trips.forEach(t=>norm(t));S.allSha=r.sha;
   if(S.curId){const t=S.ALL.trips.find(x=>x.id===S.curId);if(!t){location.hash='';return}S.D=t}
  }
  if(S.curId)renderAll(false);else renderHome();
 }catch(e){manual&&toast('Actualisation impossible ('+em(e)+').')}
}
