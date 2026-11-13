/* Trajets aller / retour (pré-étape et post-étape). */
import {esc, fmtDT} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed} from './store.js';
import {LS} from './lodging.js';
import {renderList} from './stages.js';
import {schedGeo} from './transmap.js';

export const openT=new Set();
export const MODES={train:['🚆','Train'],car:['🚗','Voiture'],plane:['✈️','Avion'],bus:['🚌','Bus'],other:['🧭','Autre']};
export const chipT=t=>{const x=LS[t.status]||LS.find;return `<span class="chip ${x[2]}">${x[0]} ${x[1]}</span>`};
export const whoLb=w=>w==='*'?'Tous':w;
export const autoPlace=(s,last)=>{if(!s||!s.auto)return'';const a=String(s.name).split(/ - | → /);return a.length>1?(last?a[a.length-1]:a[0]):''};
export const legHd=t=>`<b>${(MODES[t.mode]||MODES.other)[0]} ${esc(whoLb(t.who))} · ${esc(t.from||'?')} → ${esc(t.to||'?')}</b><span class="meta">${fmtDT(t.dep)} → ${fmtDT(t.arr)}${t.price?' · '+esc(t.price)+' €':''}</span>`;
export const legsOf=dir=>S.D.transports.filter(t=>t.dir===dir).sort((a,b)=>(a.dep||'9').localeCompare(b.dep||'9'));
export const ST_ORDER=['find','todo','booked','paid'];
export function trSummary(dir){
 const L=legsOf(dir),title=dir==='out'?'Aller · avant J1':'Retour · après J'+Math.max(1,S.D.stages.length);
 if(!L.length)return{html:`<b>🧳 ${title}</b><span class="meta">Aucun trajet prévu</span>`,chip:'<span class="chip warn">⚠ À prévoir</span>'};
 const icons=[...new Set(L.map(t=>(MODES[t.mode]||MODES.other)[0]))].join(''),first=L[0],last=L[L.length-1];
 const pr=L.reduce((a,t)=>a+(+t.price||0),0),worst=Math.min(...L.map(t=>Math.max(0,ST_ORDER.indexOf(t.status)))),x=LS[ST_ORDER[worst]];
 return{html:`<b>${icons} ${title} · ${esc(first.from||'?')} → ${esc(last.to||'?')}</b><span class="meta">${fmtDT(first.dep)} → ${fmtDT(last.arr)}${L.length>1?' · '+L.length+' trajets':''}${pr?' · '+pr+' €':''}</span>`,chip:`<span class="chip ${x[2]}">${x[0]} ${x[1]}</span>`};
}
export const legHtml=t=>{const o=openT.has('l'+t.id);return `<div class="leg" data-lid="${t.id}"><div class="hd lhd" data-a="ltog"><span class="chev">${o?'▾':'▸'}</span><div class="tt">${legHd(t)}</div>${chipT(t)}${o?'<button class="ic" data-a="ldel" aria-label="Supprimer ce trajet" title="Supprimer ce trajet">🗑</button>':''}</div>`+(o?`<div class="bd">
 <div class="row"><select data-tf="who">${['*',...S.D.participants].map(w=>`<option value="${esc(w)}" ${t.who===w?'selected':''}>${esc(whoLb(w))}</option>`).join('')}</select><select data-tf="mode">${Object.entries(MODES).map(([k,v])=>`<option value="${k}" ${t.mode===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div>
 <div class="row"><input data-tf="from" placeholder="Départ" value="${esc(t.from)}"><input data-tf="to" placeholder="Arrivée" value="${esc(t.to)}"></div>
 <div class="row"><input type="datetime-local" data-tf="dep" title="Départ" value="${esc(t.dep)}"><input type="datetime-local" data-tf="arr" title="Arrivée" value="${esc(t.arr)}"></div>
 <input data-tf="ref" placeholder="N° de train / vol, réservation…" value="${esc(t.ref)}">
 <div class="row"><input type="number" min="0" step="1" data-tf="price" placeholder="Prix total (€)" value="${esc(t.price)}"><select data-tf="payer"><option value="">Payé par ?</option>${S.D.participants.map(p=>`<option value="${esc(p)}" ${t.payer===p?'selected':''}>${esc(p)}</option>`).join('')}</select></div>
 <select data-tf="status">${Object.entries(LS).filter(([k])=>k!=='na').map(([k,v])=>`<option value="${k}" ${t.status===k?'selected':''}>${v[1]}</option>`).join('')}</select>
 <textarea data-tf="notes" rows="2" placeholder="Notes : correspondances, parking, bagages…">${esc(t.notes)}</textarea></div>`:'')+'</div>'};
export function transCard(dir){
 const o=openT.has('d'+dir),sm=trSummary(dir);
 return `<div class="card tr" data-dir="${dir}"><div class="hd thd" data-a="ttog"><span class="chev">${o?'▾':'▸'}</span><div class="tt">${sm.html}</div>${sm.chip}</div>`+(o?`<div class="bd">${legsOf(dir).map(legHtml).join('')}<div class="row"><button data-a="tadd">+ Ajouter un trajet</button></div></div>`:'')+'</div>';
}
export function transClick(e,c){
 const ae=e.target.closest('[data-a]');if(!ae)return;
 const a=ae.dataset.a,dir=c.dataset.dir,lg=e.target.closest('.leg'),id=lg&&lg.dataset.lid;
 if(a==='ttog'){const k='d'+dir;openT.has(k)?openT.delete(k):openT.add(k);renderList();return}
 if(a==='tadd'){
  const me=S.D.participants.includes(C.me)?C.me:'*';
  const t={id:'t'+Date.now().toString(36),dir,who:me,mode:'train',from:'',to:'',dep:'',arr:'',ref:'',price:'',payer:'',status:'find',notes:''};
  if(dir==='out')t.to=autoPlace(S.D.stages[0],false);else t.from=autoPlace(S.D.stages[S.D.stages.length-1],true);
  S.D.transports.push(t);openT.add('d'+dir);openT.add('l'+t.id);changed();renderList();schedGeo();return;
 }
 if(a==='ltog'){const k='l'+id;openT.has(k)?openT.delete(k):openT.add(k);renderList();return}
 if(a==='ldel'&&confirm('Supprimer ce trajet ?')){S.D.transports=S.D.transports.filter(t=>t.id!==id);changed();renderList();schedGeo()}
}
export function transInput(e,c){
 const f=e.target.dataset.tf,lg=e.target.closest('.leg');if(!f||!lg)return;
 const t=S.D.transports.find(x=>x.id===lg.dataset.lid);if(!t)return;
 t[f]=e.target.value;changed();
 lg.querySelector('.lhd .tt').innerHTML=legHd(t);
 const ch=lg.querySelector('.lhd .chip');if(ch)ch.outerHTML=chipT(t);
 const sm=trSummary(c.dataset.dir);c.querySelector('.thd .tt').innerHTML=sm.html;
 const cc=c.querySelector('.thd .chip');if(cc)cc.outerHTML=sm.chip;
 schedGeo();
}
export function transCheck(){
 const J1=(S.D.stages[0]&&S.D.stages[0].date)||S.D.start,JN=(S.D.stages.length&&S.D.stages[S.D.stages.length-1].date)||S.D.end,msg=[];
 S.D.participants.forEach(p=>{
  const mine=d=>S.D.transports.filter(t=>t.dir===d&&(t.who===p||t.who==='*')),o=mine('out'),r=mine('back');
  if(!o.length)msg.push(p+' : aucun trajet aller');
  else if(J1&&o.some(t=>t.arr&&t.arr.slice(0,10)>J1))msg.push(p+' : un aller arrive après le début du J1');
  if(!r.length)msg.push(p+' : aucun trajet retour');
  else if(JN&&r.some(t=>t.dep&&t.dep.slice(0,10)<JN))msg.push(p+' : un retour part avant le dernier jour');
 });
 return msg;
}
