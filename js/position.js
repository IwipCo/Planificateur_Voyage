/* Ma position en direct (GPS) : point bleu, cercle de précision, suivi de la carte. */
import {$} from './lib/util.js';
import {toast} from './ui.js';
import {map} from './mapcore.js';

export const posLayer=L.layerGroup().addTo(map);
let wid=null,dot=null,acc=null,follow=true,last=null,fix=null;
const fmtAcc=m=>m>=1000?(m/1000).toFixed(1).replace('.',',')+' km':Math.round(m)+' m';
function popupBox(){
 const box=document.createElement('div');
 box.innerHTML='<b>📡 Ma position</b><br><span class="meta">'+(fix?'précision ± '+fmtAcc(fix.accuracy||0)+(fix.altitude!=null?' · altitude '+Math.round(fix.altitude)+' m':''):'en attente…')+'</span><br>';
 const b=document.createElement('button');b.textContent=follow?'🎯 Recentrer':'🎯 Suivre ma position';
 b.onclick=()=>{follow=true;if(last)map.setView(last,Math.max(map.getZoom(),15));map.closePopup()};
 box.appendChild(b);return box;
}
function onPos(p){
 const ll=[p.coords.latitude,p.coords.longitude],r=p.coords.accuracy||0;
 fix=p.coords;last=ll;
 if(!dot){
  dot=L.marker(ll,{icon:L.divIcon({className:'',iconSize:[22,22],html:'<div class="me"></div>'}),zIndexOffset:1000}).addTo(posLayer);
  acc=L.circle(ll,{radius:r,color:'#1c7ed6',weight:1,fillOpacity:0.12,interactive:false}).addTo(posLayer);
  dot.bindPopup(popupBox);
  map.setView(ll,Math.max(map.getZoom(),15));                  // premier point : on se place dessus
 }else{
  dot.setLatLng(ll);acc.setLatLng(ll);acc.setRadius(r);
  if(follow)map.panTo(ll);
 }
}
function onErr(e){
 const m={1:'Localisation refusée : autorise-la pour ce site dans les réglages du navigateur.',2:'Position indisponible pour le moment.',3:'Délai dépassé : la position n’a pas pu être obtenue.'}[e&&e.code]||'Localisation impossible.';
 toast(m);if(e&&e.code===1)setPos(false);
}
export function setPos(on){
 const b=$('#bpos');
 if(on){
  if(!navigator.geolocation){toast('La localisation n’est pas disponible sur cet appareil ou ce navigateur.');return}
  if(wid!=null)return;
  follow=true;b.classList.add('on');toast('Recherche de ta position… (autorise la localisation si on te le demande)');
  wid=navigator.geolocation.watchPosition(onPos,onErr,{enableHighAccuracy:true,maximumAge:5000,timeout:30000});
 }else{
  if(wid!=null&&navigator.geolocation)navigator.geolocation.clearWatch(wid);
  wid=null;dot=acc=null;last=fix=null;posLayer.clearLayers();b.classList.remove('on');
 }
}
export function init(){
 $('#bpos').onclick=()=>setPos(wid==null);
 map.on('dragstart',()=>{follow=false});                          // si on déplace la carte à la main, on arrête de la recentrer
}
