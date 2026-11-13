/* Liste des jours : fiches repliables, édition, réorganisation. */
import {$, COL, addD, esc, fmtD} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed, save} from './store.js';
import {dist, okRoute} from './lib/stage.js';
import {drawMap} from './map.js';
import {elevHtml} from './elevation.js';
import {WX, loadWx, wxk} from './weather.js';
import {chatHtml, renderStageChats} from './chat.js';
import {LS, chip, forList, lodgOf, renderLodg} from './lodging.js';
import {openT, transCard, transClick, transInput} from './transports.js';
import {poiLine} from './poi.js';

export const openS=new Set();
export const openC=new Set();
export const hdTxt=(s,i)=>`<b>J${i+1} · ${esc(s.name)}</b><span class="meta">${fmtD(s.date)||'date ?'} · ${dist(s).toFixed(1)} km${s.elev?' · ↗ '+s.elev.up+' m':''}</span>`;
export const body=s=>{const L=lodgOf(s);return `<div class="bd">
 <div class="row"><input data-f="name" value="${esc(s.name)}"><input type="date" data-f="date" value="${esc(s.date)}"></div>
 <div class="meta">${s.points.length} repère(s) · ${okRoute(s)?(s.rmode==='car'?'itinéraire en voiture':'itinéraire à pied'):s.route?'itinéraire à recalculer':'ligne droite'}</div>${elevHtml(s)}${poiLine(s)}
 <details data-k="l" data-id="${s.id}" ${openC.has('l'+s.id)?'open':''}><summary>Hébergement ${chip(s,0)}</summary><div class="lodg">
  <input data-l="name" placeholder="Nom de l’hébergement" value="${esc(L.name)}">
  <input data-l="address" placeholder="Adresse" value="${esc(L.address)}">
  <div class="row"><input data-l="price" type="number" min="0" step="1" placeholder="Prix total (€)" value="${esc(L.price)}"><input data-l="nights" type="number" min="1" max="30" step="1" style="width:64px" title="Nombre de nuits" value="${L.nights||1}"><span class="meta">nuit(s)</span></div>
  <div class="row"><span class="meta">Annulation gratuite jusqu’au</span><input type="date" data-l="cancelBy" value="${esc(L.cancelBy)}"></div>
  <div class="row"><select data-l="status">${Object.entries(LS).map(([k,v])=>`<option value="${k}" ${L.status===k?'selected':''}>${v[1]}</option>`).join('')}</select>
  <select data-l="payer"><option value="">Payé par ?</option>${S.D.participants.map(p=>`<option value="${esc(p)}" ${L.payer===p?'selected':''}>${esc(p)}</option>`).join('')}</select></div>
  <div class="meta">Concerne :</div><div class="row" style="flex-wrap:wrap">${S.D.participants.map(p=>`<label class="chk"><input type="checkbox" data-lfor="${esc(p)}" ${forList(L).includes(p)?'checked':''}>${esc(p)}</label>`).join('')}</div>
 </div></details>
 <details data-k="w" data-id="${s.id}" ${openC.has('w'+s.id)?'open':''}><summary>🌤 Météo &amp; marées</summary><div class="wx" data-id="${s.id}">${(WX[s.id]||{}).html||'<p class="meta">Chargement…</p>'}</div></details>
 <details data-k="c" data-id="${s.id}" ${openC.has('c'+s.id)?'open':''}><summary>💬 Discussion (${(s.chat||[]).length})</summary><div class="sc" data-id="${s.id}">${chatHtml(s)}</div>
  <div class="row"><input class="cin" placeholder="Message sur ce jour…"><button class="pri" data-a="csend">Envoyer</button></div></details>
 <textarea data-f="notes" rows="3" placeholder="Notes : ravitaillement, marées, météo…">${esc(s.notes)}</textarea>
</div>`};
export function renderList(){
 renderSum();
 const cards=S.D.stages.map((s,i)=>{
  const o=!S.reorg&&openS.has(s.id);
  return `<div class="card ${s.id===S.sel?'on':''}" data-id="${s.id}">
  <div class="hd" data-a="tog">${S.reorg?'':`<span class="chev">${o?'▾':'▸'}</span>`}<span class="dot" style="background:${COL[i%COL.length]}"></span><div class="tt">${hdTxt(s,i)}</div>${chip(s)}${S.reorg?'<button class="ic" data-a="up" aria-label="Monter">▲</button><button class="ic" data-a="down" aria-label="Descendre">▼</button>':''}${(o||S.reorg)?'<button class="ic" data-a="del" aria-label="Supprimer ce jour" title="Supprimer ce jour">🗑</button>':''}</div>${o?body(s):''}</div>`}).join('');
 $('#list').innerHTML=(S.reorg?'':transCard('out'))+(cards||'<p class="meta">Aucun jour. Ajoutes-en un pour commencer.</p>')+(S.reorg?'':transCard('back'));
}
export function renderSum(){
 const tot=S.D.stages.reduce((a,s)=>a+dist(s),0),up=S.D.stages.reduce((a,s)=>a+(s.elev?s.elev.up:0),0);
 const L=S.D.stages.map(lodgOf).filter(l=>l.status!=='na'),pr=L.reduce((a,l)=>a+(+l.price||0),0),ok=L.filter(l=>l.status==='booked'||l.status==='paid').length;
 $('#sum').textContent=`${S.D.stages.length} jour(s) · ${tot.toFixed(1)} km`+(up?` · D+ ${up} m`:'')+(S.D.start&&S.D.end?` · ${fmtD(S.D.start)} → ${fmtD(S.D.end)}`:'')+` · hébergements ${ok}/${L.length} réservés`+(pr?` · ${pr} €`:'');
 renderLodg();
}
export function goStage(id){
 S.sel=id;openS.add(id);S.reorg=false;document.querySelector('.tabs [data-t=stages]').click();renderList();drawMap();
 const c=document.querySelector('.card[data-id="'+id+'"]');if(c)c.scrollIntoView({block:'nearest'});
}
export async function stageSend(s,c){
 const inp=c.querySelector('.cin'),t=inp.value.trim();if(!t)return;
 (s.chat=s.chat||[]).push({id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),author:C.me,text:t,ts:Date.now()});
 inp.value='';changed();renderStageChats();await save();
}
export function init(){
$('#list').addEventListener('input',e=>{
 const tr=e.target.closest('.card.tr');if(tr)return transInput(e,tr);
 const c=e.target.closest('.card[data-id]'),f=e.target.dataset.f,l=e.target.dataset.l,lf=e.target.dataset.lfor;
 if(!c||!(f||l||lf!==undefined))return;
 const s=S.D.stages.find(x=>x.id===c.dataset.id);
 if(lf!==undefined){
  const L=s.lodging=s.lodging||{name:'',address:'',price:'',status:'find',nights:1};
  const names=[...c.querySelectorAll('[data-lfor]')].filter(x=>x.checked).map(x=>x.dataset.lfor);
  L.for=names.length===S.D.participants.length?[]:names;changed();return;
 }
 if(l){const L=s.lodging=s.lodging||{name:'',address:'',price:'',status:'find',nights:1};L[l]=e.target.value;changed();renderSum();c.querySelectorAll('.chip').forEach(el=>el.outerHTML=chip(s,!!el.dataset.bed));return}
 s[f]=e.target.value;
 if(f==='name'){s.auto=!e.target.value.trim();if(s.auto)s.geoKey=null}
 changed();
 const h=c.querySelector('.hd .tt');if(h)h.innerHTML=hdTxt(s,S.D.stages.indexOf(s));
 if(f==='date'){renderSum();delete WX[s.id];if(openC.has('w'+s.id))loadWx(s)}
});
$('#list').addEventListener('click',e=>{
 const tc=e.target.closest('.card.tr');if(tc)return transClick(e,tc);
 const c=e.target.closest('.card[data-id]');if(!c)return;
 const ae=e.target.closest('[data-a]'),a=ae&&ae.dataset.a;
 const id=c.dataset.id,i=S.D.stages.findIndex(s=>s.id===id);
 if(!a){if(S.sel!==id){S.sel=id;document.querySelectorAll('.card[data-id]').forEach(x=>x.classList.toggle('on',x.dataset.id===id));if(S.view==='day')drawMap(true);else drawMap()}return}
 S.sel=id;
 if(a==='tog'){if(!S.reorg){openS.has(id)?openS.delete(id):openS.add(id)}renderList();if(S.view==='day')drawMap(true);else drawMap();return}
 if(a==='csend'){stageSend(S.D.stages[i],c);return}
 if(a==='wx'){loadWx(S.D.stages[i]);return}
 if(a==='up'&&i>0){[S.D.stages[i-1],S.D.stages[i]]=[S.D.stages[i],S.D.stages[i-1]];changed()}
 if(a==='down'&&i<S.D.stages.length-1){[S.D.stages[i+1],S.D.stages[i]]=[S.D.stages[i],S.D.stages[i+1]];changed()}
 if(a==='del'&&confirm('Supprimer ce jour et son tracé ?')){S.D.stages.splice(i,1);S.sel=S.D.stages[0]&&S.D.stages[0].id;changed()}
 renderList();drawMap();
});
$('#bexp').onclick=()=>{S.reorg=false;$('#breorg').classList.remove('on');S.D.stages.forEach(s=>openS.add(s.id));openT.add('dout');openT.add('dback');renderList()};
$('#bcol').onclick=()=>{S.reorg=false;$('#breorg').classList.remove('on');openS.clear();openT.delete('dout');openT.delete('dback');renderList()};
$('#breorg').onclick=()=>{S.reorg=!S.reorg;$('#breorg').classList.toggle('on',S.reorg);renderList()};
$('#badd').onclick=()=>{
 const last=S.D.stages.length?S.D.stages[S.D.stages.length-1].date:'';
 const s={id:'s'+Date.now().toString(36),name:'Jour '+(S.D.stages.length+1),auto:true,date:last?addD(last,1):(S.D.start||''),notes:'',lodging:{name:'',address:'',price:'',status:'find',nights:1},points:[]};
 S.D.stages.push(s);S.sel=s.id;openS.add(s.id);S.reorg=false;changed();renderList();drawMap();
};
$('#list').addEventListener('keydown',e=>{
 if(e.key!=='Enter'||!e.target.classList.contains('cin'))return;
 const c=e.target.closest('.card');stageSend(S.D.stages.find(x=>x.id===c.dataset.id),c);
});
$('#list').addEventListener('toggle',e=>{
 const d=e.target;if(d.tagName!=='DETAILS')return;
 const k=d.dataset.k+d.dataset.id,st=S.D.stages.find(x=>x.id===d.dataset.id);
 d.open?openC.add(k):openC.delete(k);
 if(!d.open||!st)return;
 if(d.dataset.k==='c'){const sc=d.querySelector('.sc');sc.scrollTop=sc.scrollHeight}
 if(d.dataset.k==='w'){const c=WX[st.id];if(!c||c.k!==wxk(st))loadWx(st)}
},true);
}
