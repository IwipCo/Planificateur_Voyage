/* Export GPX d’un jour ou de tout le voyage (depuis l’onglet Récap). */
import {$} from './lib/util.js';
import {S} from './state.js';
import {toast} from './ui.js';
import {stLine} from './lib/stage.js';
import {buildGpx, slug} from './lib/gpx.js';
import {POI_T} from './lib/poi.js';

let withPoi=true;
export function gpxRecapHtml(){
 const days=S.D.stages.map((s,i)=>({s,i})).filter(x=>x.s.points.length>1);
 if(!days.length)return'';
 return `<div class="sec"><span>Export GPX</span></div><div class="row" style="flex-wrap:wrap"><button class="pri" data-gpx="all">⬇ Tout le voyage</button>${days.map(x=>`<button data-gpx="${x.s.id}">⬇ J${x.i+1}</button>`).join('')}</div><label class="chk"><input type="checkbox" id="gpx-poi" ${withPoi?'checked':''}> Inclure les points d’intérêt</label>`;
}
export function download(name,text){
 const b=new Blob([text],{type:'application/gpx+xml'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=name;document.body.appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},1500);
}
export function exportGpx(id){
 const D=S.D,list=(id==='all'?D.stages:D.stages.filter(s=>s.id===id)).filter(s=>s.points.length>1);
 if(!list.length)return toast('Aucun tracé à exporter.');
 const days=list.map(s=>({name:'J'+(D.stages.indexOf(s)+1)+' · '+(s.name||''),line:stLine(s),elev:s.elev}));
 const pois=withPoi?(D.pois||[]).filter(p=>id==='all'||p.sid===id).map(p=>({name:p.name||(POI_T[p.type]||{}).l,lat:p.lat,lng:p.lng,type:(POI_T[p.type]||{}).l,note:p.note})):[];
 const title=D.title||'voyage',suffix=id==='all'?'':'-j'+(D.stages.indexOf(list[0])+1);
 download(slug(title)+suffix+'.gpx',buildGpx({name:id==='all'?title:title+' — '+days[0].name,days,pois}));
 toast('Fichier GPX prêt : '+list.length+' tracé(s)'+(pois.length?' et '+pois.length+' point(s) d’intérêt':'')+'.');
}
export function init(){
 $('#p-recap').addEventListener('click',e=>{const b=e.target.closest('[data-gpx]');if(b)exportGpx(b.dataset.gpx)});
 $('#p-recap').addEventListener('change',e=>{if(e.target.id==='gpx-poi')withPoi=e.target.checked});
}
