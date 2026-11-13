/* Itinéraire automatique ou manuel (piéton, voiture, tronçons forcés), calque GR. */
import {dm} from './lib/geo.js';
import {$, sleep} from './lib/util.js';
import {S} from './state.js';
import {hasGh} from './github.js';
import {changed} from './store.js';
import {toast, warnOnce} from './ui.js';
import {grTiles, map} from './mapcore.js';
import {cur, drawMap} from './map.js';
import {elevKey, key, okRoute} from './lib/stage.js';
import {elevStage} from './elevation.js';
import {renderList} from './stages.js';

export const rtTok=new Map();
export const elBusy=new Map();
export const tried=new Set();
export const warned=new Set();
export function setAuto(v,silent){
 S.autoOn=v;localStorage.setItem('tp_auto',v?'1':'0');
 const b=$('#bauto');b.classList.toggle('on',v);b.textContent='⚡ Auto : '+(v?'oui':'non');
 if(!silent)toast(v?'Itinéraire et dénivelé calculés automatiquement.':'Calcul automatique désactivé.');
 if(v&&!silent){autoRoute(cur());autoFill()}
}
export function autoRoute(s){if(!S.autoOn||!s||s.points.length<2)return;clearTimeout(S.at);S.at=setTimeout(()=>routeStage(s,true),900)}
export async function routeStage(s,quiet,noElev){
 if(!s||s.points.length<2)return quiet||toast('Place au moins 2 repères sur la carte (✏ Tracer).');
 quiet||toast('Calcul de l’itinéraire à pied…');
 const my=(rtTok.get(s.id)||0)+1,k0=key(s),pts=s.points.slice();rtTok.set(s.id,my);
 try{
  let out=[],km=0;
  const add=q=>{if(!out.length||dm(out[out.length-1],q)>20)out.push([+q[0].toFixed(5),+q[1].toFixed(5)])};
  const mode=s.rmode==='car'?'car':'foot',segs=[];
  let run=[pts[0]];
  for(let j=1;j<pts.length;j++){
   if(pts[j][2]){if(run.length>1)segs.push({pts:run});segs.push({pts:[pts[j-1],pts[j]],direct:true});run=[pts[j]]}
   else run.push(pts[j]);
  }
  if(run.length>1)segs.push({pts:run});
  for(const sg of segs){
   if(sg.direct){sg.pts.forEach(add);km+=dm(sg.pts[0],sg.pts[1])/1000;continue}
   for(let i=0;i<sg.pts.length-1;i+=19){
    const co=sg.pts.slice(i,i+20).map(p=>p[1]+','+p[0]).join(';');
    const r=await fetch('https://routing.openstreetmap.de/routed-'+mode+'/route/v1/driving/'+co+'?overview=full&geometries=geojson');
    const j=await r.json();if(j.code!=='Ok')throw 0;
    km+=j.routes[0].distance/1000;
    j.routes[0].geometry.coordinates.forEach(([lo,la])=>add([la,lo]));
   }
  }
  if(rtTok.get(s.id)!==my)return;
  s.route=out;s.routeKm=km;s.routeKey=k0;changed();renderList();drawMap();
  quiet||toast('Itinéraire calculé : '+km.toFixed(1)+' km');
  if(!noElev)elevStage(s,true);
 }catch(e){quiet?warnOnce('route','Itinéraire indisponible pour le moment (ou aucun chemin entre deux repères : touche un repère pour forcer une ligne droite).'):toast('Calcul impossible : service indisponible ou aucun chemin entre ces repères. Tu peux forcer un tronçon en ligne droite en touchant un repère.')}
}
export async function autoFill(){
 if(!S.autoOn||!hasGh()||!S.curId)return;
 const id=S.curId;
 for(const s of S.D.stages){
  if(S.curId!==id)return;
  if(s.points.length<2)continue;
  if(!okRoute(s)&&!tried.has('r'+s.id)){tried.add('r'+s.id);await routeStage(s,true);await sleep(1200)}
  if(S.curId!==id)return;
  if(s.points.length>1&&(!s.elev||s.elevKey!==elevKey(s))&&!tried.has('e'+s.id)){tried.add('e'+s.id);await elevStage(s,true);await sleep(1200)}
 }
}
export function setGR(v){S.grOn=v;localStorage.setItem('tp_gr',v?'1':'0');if(v)grTiles.addTo(map);else map.removeLayer(grTiles);
 const b=$('#bgr');b.classList.toggle('on',v)}
export function init(){
$('#broute').onclick=()=>routeStage(cur());
$('#bauto').onclick=()=>setAuto(!S.autoOn);
setAuto(S.autoOn,true);
$('#bgr').onclick=()=>setGR(!S.grOn);
$('#belev').onclick=async()=>{
 const s=cur();if(!s||s.points.length<2)return toast('Place au moins 2 repères sur le jour choisi.');
 toast('Mise à jour du profil…');
 if(!okRoute(s))await routeStage(s,true,true);
 await elevStage(s,false);
};
}
