/* Page d’accueil, navigation entre voyages, fenêtre de modification. */
import {$, esc, fmtY, hue, iso} from './lib/util.js';
import {DEF, S} from './state.js';
import {C} from './config.js';
import {openC, openS} from './stages.js';
import {hasGh} from './github.js';
import {createdLocal, deleted, norm, refresh, save, touched} from './store.js';
import {status, toast} from './ui.js';
import {map} from './mapcore.js';
import {dist} from './lib/stage.js';
import {autoFill} from './routing.js';
import {openT} from './transports.js';
import {openSet, resizeImg, showTab} from './trip.js';
import {renderAll} from './app.js';

export function tripStatus(m){const t=iso(new Date());if(!m.start||!m.end)return['Dates à définir','na'];if(t<m.start)return['À venir','ok'];if(t>m.end)return['Terminé','na'];return['En cours','warn']}
export function renderHome(){
 $('#hmsg').innerHTML=(S.loadErr?`<p style="padding:0 14px"><span class="chip warn">⚠ ${esc(S.loadErr)}</span></p>`:'')+(hasGh()?'':'<p class="meta" style="padding:0 14px">Lecture seule : renseigne le token (⚙) pour créer et modifier des voyages.</p>');
 const km=t=>Math.round((t.stages||[]).reduce((a,s)=>a+((s.points&&s.points.length>1)?dist(s):0),0));
 const ts=[...S.ALL.trips].sort((a,b)=>(b.start||'9999').localeCompare(a.start||'9999'));
 $('#cards').innerHTML=ts.map(m=>{const [lb,cl]=tripStatus(m),k=km(m),h=hue(m.id);return `<div class="tc" data-id="${esc(m.id)}"><button class="x ed" data-edit="${esc(m.id)}" aria-label="Modifier ce voyage" title="Modifier ce voyage">✏️</button>${m.cover?`<img class="cv" alt="" src="${esc(m.cover)}">`:`<div class="band" style="background:linear-gradient(135deg,hsl(${h} 55% 45%),hsl(${(h+40)%360} 55% 32%))">🥾</div>`}<div class="tb"><b>${esc(m.title||'Sans nom')}</b>
  <div class="meta">${m.start?fmtY(m.start)+(m.end?' → '+fmtY(m.end):''):'Dates à définir'}</div>
  <div class="meta">${(m.stages||[]).length} jour(s)${k?' · '+k+' km':''}</div>
  <div class="meta">👥 ${esc((m.participants||[]).join(', '))}</div><div><span class="chip ${cl}">${lb}</span></div></div></div>`}).join('')+'<div class="tc new" id="tnew"><div class="tb"><b>＋ Nouveau voyage</b></div></div>';
}
export function pickTrip(){
 const t=iso(new Date()),T=S.ALL.trips.filter(x=>x.start);
 const run=T.filter(x=>x.start<=t&&(x.end||x.start)>=t).sort((a,b)=>a.start.localeCompare(b.start))[0];
 return run||T.filter(x=>x.start>t).sort((a,b)=>a.start.localeCompare(b.start))[0];
}
export const drawCoverPrev=()=>{$('#td-cover-prev').innerHTML=S.ETcover?`<img class="cvp" src="${esc(S.ETcover)}" alt="">`:''};
export function openTripDlg(id){
 const t=S.ALL.trips.find(x=>x.id===id);if(!t)return;
 S.ET=t;S.ETcover=t.cover;
 const km=Math.round((t.stages||[]).reduce((a,s)=>a+((s.points&&s.points.length>1)?dist(s):0),0));
 $('#td-name').value=t.title||'';$('#td-start').value=t.start||'';$('#td-end').value=t.end||'';$('#td-parts').value=(t.participants||[]).join(', ');
 $('#td-info').textContent=`${(t.stages||[]).length} jour(s)${km?' · '+km+' km':''} · ${tripStatus(t)[0]}`;
 drawCoverPrev();$('#tdlg').showModal();
}
export async function newTrip(){
 if(!hasGh()){toast('Renseigne le token (⚙) pour créer un voyage.');return openSet()}
 const name=(prompt('Nom du voyage ?')||'').trim();if(!name)return;
 const id='v'+Date.now().toString(36);
 S.ALL.trips.push({id,title:name,start:'',end:'',participants:[C.me||'Moi'],homes:{},stages:[],messages:[],transports:[]});
 createdLocal.add(id);touched.add(id);S.dirty=true;
 location.hash='#t='+id;
 await save();
}
export function showHome(){
 S.curId=null;S.D=structuredClone(DEF);openT.clear();
 $('#trip').hidden=true;$('#home').hidden=false;document.title='Mes voyages';renderHome();
}
export function openTrip(id){
 const t=S.ALL.trips.find(x=>x.id===id);
 if(!t){toast('Voyage introuvable.');location.hash='';return}
 S.curId=id;S.D=t;norm(S.D);
 openS.clear();openC.clear();openT.clear();S.sel=S.D.stages[0]&&S.D.stages[0].id;S.view='all';S.draw=false;
 $('#home').hidden=true;$('#trip').hidden=false;map.invalidateSize();showTab('stages');renderAll(true);
 status(hasGh()?(S.dirty?'● Non enregistré':''):'Lecture seule : token à régler (⚙)');
 if(S.pendingTab){const tb=document.querySelector('.tabs [data-t='+S.pendingTab+']');S.pendingTab=null;if(tb)tb.click()}
 autoFill();
}
export async function route(){
 const m=location.hash.match(/^#t=([\w-]+)$/);
 if(S.curId&&(!m||m[1]!==S.curId)&&S.dirty&&hasGh()&&S.loaded)await save();
 if(!m)return showHome();
 openTrip(m[1]);
}
export async function delTripById(id){
 const t=S.ALL.trips.find(x=>x.id===id);if(!t)return;
 if(!hasGh()||!S.loaded)return toast('Token GitHub requis (et fichier lisible) pour supprimer.');
 if(!confirm('Supprimer « '+(t.title||'ce voyage')+' » pour tous les participants ?'))return;
 deleted.add(id);S.ALL.trips=S.ALL.trips.filter(x=>x.id!==id);touched.delete(id);S.dirty=true;
 if(S.curId===id)S.curId=null;
 await save();
 if(location.hash)location.hash='';else renderHome();
}
export function init(){
$('#cards').addEventListener('click',e=>{
 const ex=e.target.closest('[data-edit]');if(ex){e.stopPropagation();openTripDlg(ex.dataset.edit);return}
 const dx=e.target.closest('[data-del]');if(dx){e.stopPropagation();return delTripById(dx.dataset.del)}
 if(e.target.closest('#tnew'))return newTrip();
 const c=e.target.closest('.tc[data-id]');if(c)location.hash='#t='+c.dataset.id;
});
$('#td-cover').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{S.ETcover=await resizeImg(f);drawCoverPrev()}catch(x){toast('Image illisible.')}e.target.value=''});
$('#td-cover-del').onclick=()=>{S.ETcover=undefined;drawCoverPrev()};
$('#td-x').onclick=()=>$('#tdlg').close();
$('#td-del').onclick=()=>{const id=S.ET&&S.ET.id;$('#tdlg').close();if(id)delTripById(id)};
$('#td-ok').onclick=async()=>{
 const st=$('#td-start').value,en=$('#td-end').value,p=$('#td-parts').value.split(',').map(x=>x.trim()).filter(Boolean);
 if(!p.length)return toast('Il faut au moins un participant.');
 if(st&&en&&en<st)return toast('La date d’arrivée précède le départ.');
 if(!hasGh())return toast('Renseigne le token (⚙) pour enregistrer.');
 S.ET.title=$('#td-name').value.trim()||S.ET.title;S.ET.start=st;S.ET.end=en;S.ET.participants=p;
 if(S.ETcover)S.ET.cover=S.ETcover;else delete S.ET.cover;
 touched.add(S.ET.id);S.dirty=true;$('#tdlg').close();renderHome();await save();renderHome();
};
addEventListener('hashchange',route);
$('#bback').onclick=async()=>{
 if(S.dirty){if(hasGh())await save();else if(!confirm('Quitter sans enregistrer ?'))return}
 location.hash='';
};
$('#bhref').onclick=()=>refresh(true);
$('#t-del').onclick=()=>delTripById(S.curId);
}
