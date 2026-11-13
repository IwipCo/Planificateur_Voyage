/* Dessin de la carte (jours, repères, poignées), édition des points, annulation. */
import {$, COL} from './lib/util.js';
import {S} from './state.js';
import {changed} from './store.js';
import {toast} from './ui.js';
import {layer, map} from './mapcore.js';
import {okRoute} from './lib/stage.js';
import {midOf} from './lib/geo.js';
import {autoRoute} from './routing.js';
import {goStage, renderList} from './stages.js';
import {drawCov, openPoiDlg} from './poi.js';

export const cur=()=>S.D.stages.find(s=>s.id===S.sel);
export function drawMap(fit){
 layer.clearLayers();const all=[];
 S.D.stages.forEach((s,i)=>{
  const col=COL[i%COL.length],show=S.view==='all'||s.id===S.sel;
  if(!show||!s.points.length)return;
  all.push(...s.points);
  if(okRoute(s))L.polyline(s.route,{color:col,weight:s.id===S.sel&&S.view==='all'?8:5,opacity:.9}).addTo(layer);
  else if(s.points.length>1)L.polyline(s.points,{color:col,weight:4,opacity:.8,dashArray:'6 8'}).addTo(layer);
  s.points.forEach((p,j)=>{if(j&&p[2])L.polyline([s.points[j-1],p],{color:'#fff',weight:3,opacity:.95,dashArray:'3 7'}).addTo(layer)});
  if(S.view==='all'){
   L.marker(midOf(okRoute(s)?s.route:s.points),{icon:L.divIcon({className:'',iconSize:[28,28],html:`<div class="dayb" style="background:${col}">J${i+1}</div>`})}).on('click',()=>goStage(s.id)).addTo(layer);
  }else{
   s.points.forEach((p,j)=>{
    const m=L.marker(p,{draggable:true,icon:L.divIcon({className:'',iconSize:[22,22],html:`<div class="wp${p[2]?' fl':''}" style="background:${col}">${j+1}</div>`})}).addTo(layer);
    m.on('dragend',e=>{pushUndo(s);const l=e.target.getLatLng();s.points[j]=[+l.lat.toFixed(5),+l.lng.toFixed(5),...(s.points[j][2]?[1]:[])];changed();autoRoute(s);drawMap();renderList()});
    const box=document.createElement('div');box.style.cssText='display:flex;flex-direction:column;gap:6px';
    if(j>0){const t=document.createElement('button');t.textContent=p[2]?'Tronçon précédent : suivre les chemins':'Tronçon précédent : ligne droite';
     t.onclick=()=>{pushUndo(s);s.points[j]=p[2]?[p[0],p[1]]:[p[0],p[1],1];map.closePopup();changed();autoRoute(s);drawMap();renderList()};box.appendChild(t)}
    const b=document.createElement('button');b.textContent='Supprimer ce point';b.className='danger';
    b.onclick=()=>{pushUndo(s);s.points.splice(j,1);map.closePopup();changed();autoRoute(s);drawMap();renderList()};
    box.appendChild(b);m.bindPopup(box);
   });
   if(S.draw)for(let j=0;j<s.points.length-1;j++){
    const a=s.points[j],c=s.points[j+1],mid=L.latLng((a[0]+c[0])/2,(a[1]+c[1])/2);
    const ins=ll=>{pushUndo(s);s.points.splice(j+1,0,[+ll.lat.toFixed(5),+ll.lng.toFixed(5),...(s.points[j+1][2]?[1]:[])]);changed();autoRoute(s);drawMap();renderList()};
    const h=L.marker(mid,{draggable:true,icon:L.divIcon({className:'',iconSize:[22,22],html:'<div class="mid">+</div>'})}).addTo(layer);
    h.on('click',()=>ins(mid));h.on('dragend',e=>ins(e.target.getLatLng()));
   }
  }
 });
 if(S.trOn&&S.view==='all')(S.D.transports||[]).forEach(t=>{if(t.fromLL)all.push(t.fromLL);if(t.toLL)all.push(t.toLL)});
 if(fit&&all.length)map.fitBounds(all,{padding:[30,30]});else if(fit)map.setView([46.6,2.4],5);
 drawCov();$('#vall').classList.toggle('on',S.view==='all');
 $('#vday').classList.toggle('on',S.view==='day');
 $('#bdraw').classList.toggle('on',S.draw);$('#bdraw').textContent=S.draw?'✔ Terminer la modification':'✏ Modifier l’itinéraire';$('#editbar').hidden=!S.draw;const cs=cur();if(cs)$('#rmode').value=cs.rmode==='car'?'car':'foot';
 map.getContainer().style.cursor=S.draw?'crosshair':'';
}
export const UNDO={};
export function pushUndo(s){const u=UNDO[s.id]=UNDO[s.id]||[];u.push(JSON.stringify(s.points));if(u.length>50)u.shift()}
export function init(){
map.on('click',e=>{
 if(S.addPoiMode){S.addPoiMode=false;map.getContainer().style.cursor='';openPoiDlg(null,e.latlng);return}
 if(!S.draw)return;
 const s=cur();if(!s)return toast('Ajoute d’abord une étape.');
 if(S.view!=='day'){S.view='day'}
 pushUndo(s);s.points.push([+e.latlng.lat.toFixed(5),+e.latlng.lng.toFixed(5),...(S.directNext&&s.points.length?[1]:[])]);
 changed();autoRoute(s);drawMap();renderList();
});
$('#bdirect').onclick=()=>{S.directNext=!S.directNext;const b=$('#bdirect');b.classList.toggle('on',S.directNext);b.textContent='↯ Ligne droite : '+(S.directNext?'oui':'non');if(S.directNext)toast('Les prochains points seront reliés en ligne droite (hors chemins).')};
$('#rmode').onchange=()=>{const s=cur();if(!s)return;s.rmode=$('#rmode').value;changed();drawMap();renderList();if(S.autoOn)autoRoute(s);else toast('Clique sur « Calculer l’itinéraire » pour recalculer.')};
$('#vall').onclick=()=>{S.view='all';drawMap(true)};
$('#vday').onclick=()=>{S.view='day';drawMap(true)};
$('#bdraw').onclick=()=>{S.draw=!S.draw;if(S.draw)S.view='day';drawMap();if(S.draw)toast('Touche la carte pour ajouter des points, ou un « + » entre deux points pour en insérer un.')};
$('#bundo').onclick=()=>{
 const s=cur();if(!s)return;
 const u=UNDO[s.id];
 if(!u||!u.length)return toast('Rien à annuler.');
 s.points=JSON.parse(u.pop());changed();autoRoute(s);drawMap();renderList();
};
}
