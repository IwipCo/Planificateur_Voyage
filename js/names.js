/* Nom automatique des jours (ville de départ - ville d’arrivée). */
import {S} from './state.js';
import {markDirty} from './store.js';
import {sleep} from './lib/util.js';
import {hdTxt} from './stages.js';

export function scheduleNames(){clearTimeout(S.nt);S.nt=setTimeout(autoNames,1500)}
export async function place(p){
 const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&accept-language=fr&lat='+p[0]+'&lon='+p[1]);
 const a=(await r.json()).address||{};
 return a.city||a.town||a.village||a.municipality||a.hamlet||null;
}
export async function autoNames(){
 for(const s of S.D.stages){
  if(!s.auto||s.points.length<2)continue;
  const A=s.points[0],B=s.points[s.points.length-1],k='v3|'+A+'|'+B;
  if(s.geoKey===k)continue;
  try{
   const a=await place(A);await sleep(1100);const b=await place(B);
   if(a&&b){s.name=a+' - '+b;s.geoKey=k;markDirty();
    const el=document.querySelector('.card[data-id="'+s.id+'"] [data-f=name]');if(el)el.value=s.name;
    const h=document.querySelector('.card[data-id="'+s.id+'"] .hd .tt');if(h)h.innerHTML=hdTxt(s,S.D.stages.indexOf(s))}
  }catch(e){}
  await sleep(1100);
 }
}
