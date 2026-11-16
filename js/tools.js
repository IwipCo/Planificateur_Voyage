/* Outils de carte : échelle, repères kilométriques, règle, inversion du sens d’un jour, moteur d’itinéraire. */
import {$, COL} from './lib/util.js';
import {S} from './state.js';
import {changed} from './store.js';
import {toast} from './ui.js';
import {map} from './mapcore.js';
import {stLine} from './lib/stage.js';
import {dm} from './lib/geo.js';
import {fmtDur, kmMarks, kmStepFor, reversePoints} from './lib/track.js';
import {cur, drawMap, pushUndo} from './map.js';
import {autoRoute, fetchRoute} from './routing.js';
import {renderList} from './stages.js';

L.control.scale({position:'bottomleft',metric:true,imperial:false,maxWidth:140}).addTo(map);   // l’échelle suit le zoom toute seule
export const kmLayer=L.layerGroup().addTo(map);
export const rulerLayer=L.layerGroup().addTo(map);
let kmOn=localStorage.getItem('tp_km')==='1';
const fk=v=>(Math.round(v*10)/10).toString().replace('.',',');

/* ---- repères kilométriques : le pas dépend du zoom ---- */
export function drawKm(){
 kmLayer.clearLayers();
 const b=$('#bkm');b.classList.toggle('on',kmOn);
 if(!kmOn){b.textContent='🏁 Repères km';return}
 const step=kmStepFor(map.getZoom(),map.getCenter().lat),bounds=map.getBounds().pad(0.25);
 b.textContent='🏁 Repères '+fk(step)+' km';
 S.D.stages.forEach((s,i)=>{
  if(s.points.length<2)return;
  if(S.view==='day'&&s.id!==S.sel)return;
  kmMarks(stLine(s),step).forEach(m=>{
   if(!bounds.contains([m.lat,m.lng]))return;
   L.marker([m.lat,m.lng],{interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[40,18],html:`<div class="kmm" style="border-color:${COL[i%COL.length]}">${fk(m.km)} km</div>`})}).addTo(kmLayer);
  });
 });
}
export function setKm(v){kmOn=v;localStorage.setItem('tp_km',v?'1':'0');drawKm();if(v)toast('Repères kilométriques depuis le départ de chaque jour : le pas change avec le zoom.')}

/* ---- inverser le sens d’un jour ---- */
export function reverseDay(){
 const s=cur();if(!s||s.points.length<2)return toast('Aucun tracé à inverser sur le jour choisi.');
 pushUndo(s);
 s.points=reversePoints(s.points);
 if(s.auto)s.geoKey=null;                                  // nom automatique : recalculé « arrivée - départ »
 else{const m=String(s.name||'').match(/^(.+?) (?:-|→) (.+)$/);if(m)s.name=m[2]+' - '+m[1]}
 changed();autoRoute(s);drawMap();renderList();
 toast('Sens du tracé inversé (le bouton « Annuler le dernier point » le rétablit).');
}

/* ---- règle : deux points -> distance à vol d’oiseau, ou itinéraire ---- */
let rulerOn=false,A=null,B=null,mkA=null,mkB=null,straight=null,routeLine=null;
const MODE_L={foot:'🥾 à pied',bike:'🚴 à vélo',car:'🚗 en voiture'};
function rulBox(html){const b=$('#rulbox');b.hidden=!html;if(html)b.innerHTML=html}
function rulStatus(extra){
 if(!A)return rulBox(`<div class="rh"><b>📏 Règle</b><button class="ic" data-rul="x" aria-label="Fermer">✕</button></div><div class="meta">Touche le premier point sur la carte.</div>`);
 if(!B)return rulBox(`<div class="rh"><b>📏 Règle</b><button class="ic" data-rul="x" aria-label="Fermer">✕</button></div><div class="meta">Touche le deuxième point.</div>`);
 const d=dm(A,B)/1000;
 rulBox(`<div class="rh"><b>📏 Règle</b><button class="ic" data-rul="x" aria-label="Fermer">✕</button></div>
  <div>À vol d’oiseau : <b>${fk(Math.round(d*100)/100)} km</b></div>
  <div class="row" style="flex-wrap:wrap">${Object.entries(MODE_L).map(([k,l])=>`<button data-rm="${k}">${l}</button>`).join('')}</div>
  <div class="meta" id="rul-r">${extra||'Ou calcule l’itinéraire entre les deux points.'}</div>`);
}
function rulClear(){rulerLayer.clearLayers();A=B=mkA=mkB=straight=routeLine=null}
function rulDraw(){
 if(straight){rulerLayer.removeLayer(straight);straight=null}
 if(routeLine){rulerLayer.removeLayer(routeLine);routeLine=null}
 if(A&&B)straight=L.polyline([A,B],{color:'#e03131',weight:3,dashArray:'6 8'}).addTo(rulerLayer);
 rulStatus();
}
function mk(p,label){
 const m=L.marker(p,{draggable:true,icon:L.divIcon({className:'',iconSize:[22,22],html:`<div class="rpt">${label}</div>`})}).addTo(rulerLayer);
 m.on('drag',e=>{const l=e.target.getLatLng();if(label==='A')A=[l.lat,l.lng];else B=[l.lat,l.lng];if(A&&B){if(straight)straight.setLatLngs([A,B]);if(routeLine){rulerLayer.removeLayer(routeLine);routeLine=null}rulStatus()}});
 return m;
}
export function setRuler(v){
 rulerOn=v;$('#brul').classList.toggle('on',v);map.getContainer().style.cursor=v?'crosshair':'';
 if(v){S.draw=false;S.addPoiMode=false;drawMap();rulClear();rulStatus();toast('Règle : touche deux points sur la carte.')}
 else{rulClear();rulBox('')}
}
function rulClick(ll){
 if(!rulerOn)return;
 const p=[+ll.lat.toFixed(5),+ll.lng.toFixed(5)];
 if(!A||(A&&B)){rulClear();A=p;mkA=mk(A,'A');rulStatus();return}
 B=p;mkB=mk(B,'B');rulDraw();
}
async function rulRoute(mode){
 if(!A||!B)return;
 const r=document.getElementById('rul-r');if(r)r.textContent='Calcul de l’itinéraire…';
 try{
  const eng=$('#reng').value==='brouter'?'brouter':'osrm',res=await fetchRoute([A,B],mode,eng);
  if(routeLine)rulerLayer.removeLayer(routeLine);
  routeLine=L.polyline(res.coords,{color:'#1c7ed6',weight:5,opacity:.9}).addTo(rulerLayer);
  const d=dm(A,B)/1000,pc=Math.round((res.km/(d||1)-1)*100);
  rulStatus(`${MODE_L[mode]} : <b>${fk(Math.round(res.km*100)/100)} km</b>${res.sec?' · ≈ '+fmtDur(res.sec):''} <span class="meta">(${pc>=0?'+':'−'}${Math.abs(pc)} % par rapport au vol d’oiseau)</span>`);
 }catch(e){rulStatus('Itinéraire indisponible entre ces deux points ('+(e&&e.message?e.message:'erreur')+').')}
}

export function init(){
 $('#bkm').onclick=()=>setKm(!kmOn);
 $('#brev').onclick=reverseDay;
 $('#brul').onclick=()=>setRuler(!rulerOn);
 $('#bdraw').addEventListener('click',()=>{if(S.draw&&rulerOn)setRuler(false)});
 $('#rulbox').addEventListener('click',e=>{
  if(e.target.closest('[data-rul=x]'))return setRuler(false);
  const b=e.target.closest('[data-rm]');if(b)rulRoute(b.dataset.rm);
 });
 map.on('click',e=>rulClick(e.latlng));
 map.on('zoomend moveend',()=>{if(kmOn)drawKm()});
 window.addEventListener('tp:redraw',drawKm);
 $('#reng').onchange=()=>{const s=cur();if(!s)return;s.engine=$('#reng').value;changed();drawMap();renderList();if(S.autoOn)autoRoute(s);else toast('Clique sur « Calculer l’itinéraire » pour recalculer.')};
 drawKm();
}
