/* Chargement, fusion, migration et enregistrement des voyages dans un seul fichier. */
import {C} from './config.js';
import {S} from './state.js';
import {ghGet, ghPut, hasGh} from './github.js';
import {em, sleep} from './lib/util.js';
import {clone, mergeVal} from './lib/merge.js';
import {status, toast} from './ui.js';
import {scheduleNames} from './names.js';
import {renderChat} from './chat.js';
import {renderHome} from './home.js';
import {openSet} from './trip.js';
import {renderAll} from './app.js';

export function norm(d){
 d.stages=d.stages||[];d.messages=d.messages||[];d.participants=Array.isArray(d.participants)&&d.participants.length?d.participants:['Moi'];
 d.start=d.start||'';d.end=d.end||'';d.title=d.title||'';d.transports=d.transports||[];d.homes=d.homes||{};d.checklist=d.checklist||[];d.pois=d.pois||[];d.tabsOff=d.tabsOff||[];d.preLodging=d.preLodging||{name:'',address:'',price:'',status:'na',nights:1,cancelBy:'',payer:'',for:[]};d.preLodging.nights=d.preLodging.nights||1;d.poiCov=d.poiCov||{};d.pois.forEach(x=>{if(x.type==='food')x.type='resto';if(x.type==='shelter')x.type='camp'});d.spend=d.spend||[];d.payments=d.payments||[];
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
const normAll=o=>{(o.trips||[]).forEach(t=>norm(t));return o};   // les valeurs par défaut ne doivent jamais passer pour des modifications : base, local et distant sont normalisés pareil
let base=null;      // dernière version du fichier telle que le serveur nous l'a donnée : sert à calculer ce que NOUS avons changé
export async function loadAll(){
 S.ALL={version:2,trips:[]};S.allSha=null;S.loaded=false;S.loadErr='';base=null;
 let migrated=false;
 if(hasGh()){
  try{const r=await ghGet(C.path);S.ALL=wrap(r.data);base=normAll(clone(S.ALL));S.allSha=r.sha;S.loaded=true;if(!Array.isArray(r.data.trips))migrated=true}
  catch(e){if(e.message==='404'){S.loaded=true;base={version:2,trips:[]}}else S.loadErr='Lecture de '+C.path+' impossible ('+em(e)+')'}
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
 if(!base)base=normAll(clone(S.ALL));
 S.ALL.trips.forEach(t=>norm(t));
 if(migrated&&hasGh()&&S.loaded){
  try{S.allSha=await ghPut(C.path,S.ALL,S.allSha,'Regroupement de tous les voyages dans un seul fichier');base=clone(S.ALL);toast('Tous tes voyages sont maintenant regroupés dans '+C.path+'.')}
  catch(e){S.loadErr='Regroupement non enregistré ('+em(e)+')';S.dirty=true}
 }
}
/* Applique NOS modifications (local - base) sur la version distante rem : rien de ce que d'autres ont modifié ailleurs n'est écrasé. */
function syncRemote(rem,sha){
 normAll(rem);
 const nb=clone(rem);
 S.ALL=mergeVal(base||{version:2,trips:[]},S.ALL,rem,'root')||rem;
 S.ALL.trips.forEach(t=>norm(t));
 base=nb;S.allSha=sha;
 if(S.curId){const t=S.ALL.trips.find(x=>x.id===S.curId);if(t)S.D=t}
}
export async function save(){
 if(!hasGh()){openSet();return toast('Renseigne le token GitHub pour enregistrer.')}
 if(!S.loaded)return toast('Le fichier de données n’a pas pu être lu : enregistrement bloqué pour ne rien écraser.');
 status('Enregistrement…');
 try{
  let merged=false;
  for(let attempt=0;;attempt++){
   let rem=null,rs=null;
   try{const r=await ghGet(C.path);rem=r.data;rs=r.sha}catch(e){if(e.message!=='404')throw e}
   if(rem&&rs!==S.allSha){syncRemote(wrap(rem),rs);merged=true}
   try{S.allSha=await ghPut(C.path,S.ALL,rs,'Voyages mis à jour par '+(C.me||'?'));break}
   catch(e){if((e.message==='409'||e.message==='422')&&attempt<3){await sleep(400);continue}throw e}     // quelqu'un a écrit entre-temps : on relit, on refusionne, on réessaie
  }
  base=clone(S.ALL);touched.clear();createdLocal.clear();S.dirty=false;status('✓ Enregistré');
  if(merged){if(S.curId)renderAll(false);else renderHome()}else renderChat();
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
  if(S.dirty){syncRemote(rem,r.sha);toast('Modifications des autres récupérées ; les tiennes restent à enregistrer.')}
  else{
   normAll(rem);base=clone(rem);S.ALL=rem;S.allSha=r.sha;
   if(S.curId){const t=S.ALL.trips.find(x=>x.id===S.curId);if(!t){location.hash='';return}S.D=t}
  }
  if(S.curId)renderAll(false);else renderHome();
 }catch(e){manual&&toast('Actualisation impossible ('+em(e)+').')}
}
