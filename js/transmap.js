/* Trajets aller / retour sur la carte. */
import {$, esc, fmtDT, sleep} from './lib/util.js';
import {S} from './state.js';
import {markDirty} from './store.js';
import {toast} from './ui.js';
import {map, trLayer} from './mapcore.js';
import {MODES, whoLb} from './transports.js';

export const schedGeo=()=>{clearTimeout(S.gt2);S.gt2=setTimeout(()=>geoTrans(),1200)};
export async function geocode(q){
 const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fr&q='+encodeURIComponent(q));
 const j=await r.json();
 return j[0]?[+(+j[0].lat).toFixed(5),+(+j[0].lon).toFixed(5)]:null;
}
export const geoStale=()=>(S.D.transports||[]).some(t=>['from','to'].some(k=>(t[k]||'').trim()&&t[k+'Q']!==t[k].trim()));
export function drawTrans(){
 trLayer.clearLayers();if(!S.trOn)return;
 (S.D.transports||[]).forEach(t=>{
  const a=t.fromLL,b=t.toLL;if(!a||!b)return;
  const col=t.dir==='out'?'#2e86ab':'#a23b72',m=MODES[t.mode]||MODES.other;
  const tip=`${m[0]} ${esc(whoLb(t.who))} · ${esc(t.from)} → ${esc(t.to)}<br>${fmtDT(t.dep)} → ${fmtDT(t.arr)}`;
  L.polyline([a,b],{color:col,weight:3,opacity:.85,dashArray:'2 8',lineCap:'round'}).bindPopup(tip).addTo(trLayer);
  [a,b].forEach(q=>L.circleMarker(q,{radius:5,color:'#fff',weight:2,fillColor:col,fillOpacity:1}).addTo(trLayer));
  L.marker([(a[0]+b[0])/2,(a[1]+b[1])/2],{icon:L.divIcon({className:'',iconSize:[24,24],html:`<div class="tmk" style="border-color:${col}">${m[0]}</div>`})}).bindPopup(tip).addTo(trLayer);
 });
}
export function fitTrans(){
 const pts=[];
 (S.D.transports||[]).forEach(t=>{if(t.fromLL)pts.push(t.fromLL);if(t.toLL)pts.push(t.toLL)});
 S.D.stages.forEach(s=>pts.push(...s.points));
 if(pts.length)map.fitBounds(pts,{padding:[30,30]});
}
export async function geoTrans(fit){
 if(!S.trOn||S.geoBusy)return;
 S.geoBusy=true;let failed=false;
 try{
  for(const t of S.D.transports||[]){
   for(const k of ['from','to']){
    const q=(t[k]||'').trim();
    if(!q){t[k+'LL']=null;t[k+'Q']='';continue}
    if(t[k+'Q']===q)continue;
    t[k+'LL']=await geocode(q);t[k+'Q']=q;markDirty();
    drawTrans();await sleep(1100);
   }
  }
 }catch(e){failed=true;toast('Localisation des lieux impossible pour le moment.')}
 S.geoBusy=false;drawTrans();
 if(fit)fitTrans();
 if(!failed&&geoStale())setTimeout(()=>geoTrans(),500);
}
export function setTr(v){
 S.trOn=v;localStorage.setItem('tp_tr',v?'1':'0');$('#btr').classList.toggle('on',v);
 if(!v){trLayer.clearLayers();return}
 if(!(S.D.transports||[]).length)toast('Aucun trajet pour l’instant : ajoute-en dans l’onglet Trajets.');
 drawTrans();geoTrans(true);
}
export function init(){
$('#btr').classList.toggle('on',S.trOn);
$('#btr').onclick=()=>setTr(!S.trOn);
}
