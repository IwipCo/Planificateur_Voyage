/* Hébergements sur la carte : à partir de l'adresse (localisation automatique) ou d'un point placé à la main. */
import {$, esc, fmtD, sleep} from './lib/util.js';
import {S} from './state.js';
import {changed, markDirty} from './store.js';
import {toast} from './ui.js';
import {map} from './mapcore.js';
import {LS, lodgOf, preActive, preDate} from './lodging.js';
import {geocode} from './transmap.js';
import {drawMap} from './map.js';
import {setRuler} from './tools.js';
import {goStage, openC, renderList} from './stages.js';
import {showTab} from './trip.js';
import {openT} from './transports.js';

export const lodgLayer=L.layerGroup().addTo(map);
let on=localStorage.getItem('tp_lodgmap')==='1',pin=null,busy=false,tmr=null;

/* tous les hébergements utilisables : ceux des jours (hors « pas de nuit ») et celui de la veille de J1 */
export function lodgItems(){
 const out=[];
 S.D.stages.forEach((s,i)=>{const lg=lodgOf(s);if(lg.status!=='na')out.push({lg,label:'J'+(i+1),date:s.date,stage:s})});
 if(preActive())out.push({lg:S.D.preLodging,label:'Veille de J1',date:preDate(),pre:true});
 return out;
}
const addr=lg=>String(lg.address||'').trim();
/* faut-il chercher la position d'après l'adresse ? (jamais si elle a été placée à la main) */
export const needsGeo=lg=>!!addr(lg)&&lg.llQ!==addr(lg)&&(lg.llSrc!=='manual'||!lg.ll);

function popup(it){
 const lg=it.lg,t=LS[lg.status]||LS.find,n=+lg.nights||1,box=document.createElement('div');
 box.innerHTML=`<b>🛏 ${esc(lg.name||'Hébergement')}</b> <span class="meta">· ${esc(it.label)}</span>${addr(lg)?'<br>'+esc(addr(lg)):''}`+
  (it.date?`<br><span class="meta">Nuit${n>1?'s':''} du ${fmtD(it.date)}${n>1?' ('+n+' nuits)':''}</span>`:'')+
  `<br><span class="chip ${t[2]}">${t[0]} ${t[1]}</span>${lg.price?' <b>'+esc(lg.price)+' €</b>':''}${lg.payer?'<br><span class="meta">payé par '+esc(lg.payer)+'</span>':''}`+
  (lg.cancelBy?`<br><span class="meta">⏰ annulation gratuite jusqu’au ${fmtD(lg.cancelBy)}</span>`:'')+'<br>';
 const open=document.createElement('button');open.textContent='✏ Ouvrir la fiche';
 open.onclick=()=>{map.closePopup();if(it.pre){showTab('stages');openT.add('dout');openC.add('plpre');renderList()}else{openC.add('l'+it.stage.id);goStage(it.stage.id)}};
 const mv=document.createElement('button');mv.textContent='📍 Déplacer';mv.onclick=()=>{map.closePopup();startPin(lg,it.label)};
 box.appendChild(open);box.appendChild(mv);return box;
}
export function drawLodg(){
 lodgLayer.clearLayers();
 $('#blodg').classList.toggle('on',on);
 if(!on)return;
 lodgItems().forEach(it=>{
  const lg=it.lg;if(!lg.ll)return;
  const ok=lg.status==='booked'||lg.status==='paid';
  L.marker(lg.ll,{icon:L.divIcon({className:'',iconSize:[30,30],html:`<div class="lgm ${ok?'ok':'warn'}">🛏</div>`})}).bindPopup(()=>popup(it)).addTo(lodgLayer);
 });
}
/* localise (une à la fois, ~1 requête par seconde) les adresses qui n'ont pas encore de position */
export async function geoLodg(){
 if(!on||busy)return;
 const todo=lodgItems().filter(it=>needsGeo(it.lg));
 if(!todo.length)return;
 busy=true;let fails=[];
 try{
  for(const it of todo){
   const a=addr(it.lg);
   try{const r=await geocode(a);it.lg.llQ=a;it.lg.llSrc='addr';if(r)it.lg.ll=r;else{delete it.lg.ll;fails.push(it.label)}}
   catch(e){fails=null;break}
   markDirty();drawLodg();await sleep(1100);
  }
 }finally{busy=false}
 if(fails===null)toast('Localisation des adresses impossible pour le moment.');
 else if(fails.length)toast('Adresse introuvable ('+fails.join(', ')+') : place l’hébergement à la main depuis sa fiche (📍).');
}
export function setLodg(v){
 on=v;localStorage.setItem('tp_lodgmap',v?'1':'0');drawLodg();
 if(v){
  const n=lodgItems().filter(it=>it.lg.ll).length,todo=lodgItems().filter(it=>needsGeo(it.lg)).length;
  toast(n||todo?'Hébergements sur la carte : touche-en un pour voir les détails.':'Aucun hébergement à afficher : renseigne une adresse, ou place-le à la main depuis sa fiche (📍).');
  geoLodg();
 }
}
/* placer / retirer à la main */
export function startPin(lg,label){
 pin={lg,label};
 S.draw=false;S.addPoiMode=false;setRuler(false);drawMap();
 if(!on)setLodg(true);
 map.getContainer().style.cursor='crosshair';
 toast('Touche la carte à l’emplacement de l’hébergement ('+label+'). Touche « 🛏 Hébergements » pour annuler.');
}
export function clearPin(lg){delete lg.ll;lg.llQ=addr(lg);lg.llSrc='cleared';changed();drawLodg()}
function pinClick(ll){
 if(!pin)return;
 const lg=pin.lg;lg.ll=[+ll.lat.toFixed(5),+ll.lng.toFixed(5)];lg.llSrc='manual';lg.llQ=addr(lg);
 pin=null;map.getContainer().style.cursor='';changed();drawLodg();renderList();toast('Hébergement placé sur la carte.');
}
export function init(){
 $('#blodg').onclick=()=>{if(pin){pin=null;map.getContainer().style.cursor='';toast('Placement annulé.');return}setLodg(!on)};
 map.on('click',e=>pinClick(e.latlng));
 window.addEventListener('tp:redraw',()=>{drawLodg();geoLodg()});
 $('#list').addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(()=>{drawLodg();geoLodg()},800)});
 drawLodg();
}
