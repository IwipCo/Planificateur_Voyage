/* Dénivelé et profil d’altitude (Open-Meteo, OpenTopoData, Open-Elevation). */
import {em, fetchT, sleep} from './lib/util.js';
import {changed} from './store.js';
import {toast, warnOnce} from './ui.js';
import {elBusy} from './routing.js';
import {elevKey, samples} from './lib/stage.js';
import {renderList} from './stages.js';

export const ll=c=>c.map(p=>p.la.toFixed(5)+','+p.lo.toFixed(5));
export const EL_PROV=[
 ['Open-Meteo',async c=>{
  const r=await fetchT('https://api.open-meteo.com/v1/elevation?latitude='+c.map(p=>p.la.toFixed(5)).join(',')+'&longitude='+c.map(p=>p.lo.toFixed(5)).join(','));
  const j=await r.json();if(!j.elevation||j.elevation.length!==c.length)throw new Error(j.reason||('HTTP '+r.status));return j.elevation}],
 ['OpenTopoData',async c=>{
  const r=await fetchT('https://api.opentopodata.org/v1/eudem25m,srtm30m?locations='+ll(c).join('|'));
  const j=await r.json();if(!j.results||j.results.length!==c.length)throw new Error(j.error||('HTTP '+r.status));return j.results.map(x=>x.elevation==null?0:x.elevation)}],
 ['Open-Elevation',async c=>{
  const r=await fetchT('https://api.open-elevation.com/api/v1/lookup?locations='+ll(c).join('|'));
  const j=await r.json();if(!j.results||j.results.length!==c.length)throw new Error('HTTP '+r.status);return j.results.map(x=>x.elevation)}]
];
export const elFail={};
export async function fetchElev(c){
 let list=EL_PROV.filter(([n])=>Date.now()-(elFail[n]||0)>600000);if(!list.length)list=EL_PROV;
 const errs=[];
 for(const [n,f] of list){
  try{return await f(c)}
  catch(e){elFail[n]=Date.now();errs.push(n+' : '+(e.name==='AbortError'?'délai dépassé':e.message));await sleep(1100)}
 }
 throw new Error(errs.join(' · '));
}
export async function elevStage(s,quiet){
 if(!s||s.points.length<2)return;
 const t0=elBusy.get(s.id);if(t0&&Date.now()-t0<90000)return;
 elBusy.set(s.id,Date.now());
 try{
  const k0=elevKey(s),sm=samples(s),z=[];
  for(let i=0;i<sm.length;i+=100){z.push(...await fetchElev(sm.slice(i,i+100)));if(i+100<sm.length)await sleep(1100)}
  const sz=z.map((v,i)=>{const a=z.slice(Math.max(0,i-2),i+3);return a.reduce((x,y)=>x+y,0)/a.length});
  let up=0,dn=0,ref=sz[0];
  for(const v of sz){if(v-ref>=3){up+=v-ref;ref=v}else if(ref-v>=3){dn+=ref-v;ref=v}}
  s.elev={d:sm.map(p=>+p.d.toFixed(2)),z:sz.map(Math.round),up:Math.round(up),dn:Math.round(dn),min:Math.round(Math.min(...sz)),max:Math.round(Math.max(...sz))};
  s.elevKey=k0;changed();renderList();
  if(!quiet)toast('Profil mis à jour : D+ '+s.elev.up+' m · D− '+s.elev.dn+' m');
 }catch(e){const m='Dénivelé indisponible : '+em(e);quiet?warnOnce('elev',m):toast(m)}
 finally{elBusy.delete(s.id)}
}
export function profSvg(s){
 const e=s.elev,W=300,H=80,P=4,dm=e.d[e.d.length-1]||1,lo=e.min,hi=Math.max(e.max,lo+10);
 const x=d=>P+(W-2*P)*d/dm,y=z=>H-P-(H-2*P)*(z-lo)/(hi-lo);
 const pts=e.d.map((d,i)=>x(d).toFixed(1)+','+y(e.z[i]).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Profil altimétrique"><polygon points="${P},${H-P} ${pts} ${W-P},${H-P}" fill="var(--sea)" opacity=".25"/><polyline points="${pts}" fill="none" stroke="var(--sea)" stroke-width="1.5"/></svg><div class="meta" style="display:flex;justify-content:space-between"><span>min ${e.min} m</span><span>${dm.toFixed(1)} km</span><span>max ${e.max} m</span></div>`;
}
export const elevHtml=s=>{try{return s.elev?`<div class="meta">↗ ${s.elev.up} m · ↘ ${s.elev.dn} m${s.elevKey!==elevKey(s)?' · à recalculer':''}</div>`+profSvg(s):'<div class="meta">Dénivelé : calcul en cours ou non disponible</div>'}catch(e){return''}};
