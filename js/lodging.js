/* Hébergements : statuts, nuits couvertes, récapitulatif. */
import {$, addD, esc, fmtD} from './lib/util.js';
import {S} from './state.js';
import {goStage} from './stages.js';

export const LS={find:['⚠','À trouver','warn'],todo:['⚠','À réserver','warn'],booked:['✅','Réservé','ok'],paid:['💶','Payé','ok'],na:['—','Pas de nuit','na']};
export const lodgOf=s=>s.lodging||{};
export const chip=(s,bed=1)=>{const t=LS[lodgOf(s).status]||LS.find;return `<span class="chip ${t[2]}"${bed?' data-bed="1"':''}>${bed?'🛏 ':''}${t[0]} ${t[1]}</span>`};
export const nightsList=()=>{if(!S.D.start||!S.D.end||S.D.end<=S.D.start)return[];const o=[];for(let d=S.D.start;d<S.D.end&&o.length<400;d=addD(d,1))o.push(d);return o};
export function coverMap(){const m={};S.D.stages.forEach(s=>{const L=lodgOf(s);if(!s.date||L.status==='na'||!(L.name||'').trim())return;for(let k=0;k<Math.max(1,+L.nights||1);k++)m[addD(s.date,k)]=s});return m}
export const forList=L=>{const f=(L.for||[]).filter(x=>S.D.participants.includes(x));return f.length?f:S.D.participants};
export function renderLodg(){
 const el=$('#p-lodg');if(!el||el.hidden)return;
 const ns=nightsList(),cm=coverMap(),all=S.D.stages.filter(s=>lodgOf(s).status!=='na');
 const cnt=k=>all.filter(s=>lodgOf(s).status===k).length,pr=all.reduce((a,s)=>a+(+lodgOf(s).price||0),0);
 let h=`<p class="meta">Réservés ${cnt('booked')} · Payés ${cnt('paid')} · À réserver ${cnt('todo')} · À trouver ${cnt('find')}${pr?' · total '+pr+' €':''}</p>`;
 if(!ns.length)h+='<p class="meta">Renseigne les dates de départ et d’arrivée (onglet Voyage) pour vérifier que toutes les nuits sont couvertes.</p>';
 else{
  const miss=ns.filter(d=>!cm[d]);
  h+=miss.length?`<p><span class="chip warn">⚠ ${miss.length} nuit(s) sans hébergement sur ${ns.length}</span></p>`:`<p><span class="chip ok">✅ Les ${ns.length} nuits sont couvertes</span></p>`;
  h+='<table class="rc"><tr><th>Nuit</th><th>Hébergement</th><th>Statut</th></tr>'+ns.map(d=>{
   const s=cm[d];if(!s)return `<tr class="miss"><td>${fmtD(d)}</td><td colspan="2">Aucun hébergement</td></tr>`;
   const L=lodgOf(s);
   return `<tr data-id="${s.id}"><td>${fmtD(d)}<br><span class="meta">J${S.D.stages.indexOf(s)+1}</span></td><td>${esc(L.name)}<br><span class="meta">${esc(L.address||'')}${L.price&&d===s.date?' · '+esc(L.price)+' €':''}${L.cancelBy&&d===s.date?' · ⏰ annulation avant le '+fmtD(L.cancelBy):''}</span></td><td>${chip(s,0)}</td></tr>`}).join('')+'</table>';
 }
 const nd=all.filter(s=>!s.date).map(s=>'J'+(S.D.stages.indexOf(s)+1));
 if(nd.length)h+=`<p class="meta">Sans date, donc non comptés : ${nd.join(', ')}.</p>`;
 el.innerHTML=h;
}
export function init(){
$('#p-lodg').addEventListener('click',e=>{const tr=e.target.closest('tr[data-id]');if(tr)goStage(tr.dataset.id)});
}
