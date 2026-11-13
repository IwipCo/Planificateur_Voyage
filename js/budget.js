/* Budget, dépenses et remboursements. */
import {$, esc, eur, fmtD, iso} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed} from './store.js';
import {forList, lodgOf} from './lodging.js';
import {MODES} from './transports.js';
import {settle} from './lib/money.js';

export function expenses(){
 const E=[],P=S.D.participants;
 S.D.stages.forEach((s,i)=>{const L=lodgOf(s),a=+L.price;if(L.status==='na'||!(a>0))return;E.push({src:'auto',label:'J'+(i+1)+' · 🛏 '+(L.name||'Hébergement'),amt:a,payer:L.payer||'',who:forList(L)})});
 S.D.transports.forEach(t=>{const a=+t.price;if(!(a>0))return;E.push({src:'auto',label:(t.dir==='out'?'Aller':'Retour')+' · '+(MODES[t.mode]||MODES.other)[0]+' '+(t.from||'?')+' → '+(t.to||'?'),amt:a,payer:t.payer||'',who:(t.who==='*'||!P.includes(t.who))?P:[t.who]})});
 S.D.spend.forEach(x=>{const a=+x.amt;if(!(a>0))return;E.push({src:'m',id:x.id,label:x.label||'Dépense',amt:a,payer:x.payer||'',who:forList(x)})});
 return E;
}
export const spendOpen=new Set();
export const payerOpts=v=>'<option value="">Payé par ?</option>'+S.D.participants.map(p=>`<option value="${esc(p)}" ${v===p?'selected':''}>${esc(p)}</option>`).join('');
export const spHd=x=>`<b>${esc(x.label||'Dépense')}</b><span class="meta">${+x.amt>0?eur(+x.amt):'? €'} · ${x.payer?esc(x.payer):'⚠ payeur ?'}${x.date?' · '+fmtD(x.date):''}</span>`;
export const spendCard=x=>{const o=spendOpen.has(x.id);return `<div class="card" data-sid="${x.id}"><div class="hd" data-a="stog"><span class="chev">${o?'▾':'▸'}</span><div class="tt">${spHd(x)}</div>${o?'<button class="ic" data-a="sdel" aria-label="Supprimer cette dépense" title="Supprimer cette dépense">🗑</button>':''}</div>`+(o?`<div class="bd">
 <input data-sf="label" placeholder="Dépense (repas, courses, parking…)" value="${esc(x.label)}">
 <div class="row"><input type="number" min="0" step="0.01" data-sf="amt" placeholder="Montant (€)" value="${esc(x.amt)}"><input type="date" data-sf="date" value="${esc(x.date)}"></div>
 <select data-sf="payer">${payerOpts(x.payer)}</select>
 <div class="meta">Concerne :</div><div class="row" style="flex-wrap:wrap">${S.D.participants.map(p=>`<label class="chk"><input type="checkbox" data-sfor="${esc(p)}" ${forList(x).includes(p)?'checked':''}>${esc(p)}</label>`).join('')}</div></div>`:'')+'</div>'};
export function budgetTop(){
 const E=expenses();
 if(!E.length&&!S.D.payments.length)return '<p class="meta">Aucune dépense pour l’instant : renseigne des prix (hébergements, trajets) ou ajoute une dépense.</p>';
 const {bal,tr,un}=settle(E,S.D.participants,S.D.payments),tot=E.reduce((a,e)=>a+e.amt,0);S.lastTr=tr;
 let h=`<div class="sec"><span>Total · ${eur(tot)}</span></div><table class="rc"><tr><th>Participant</th><th>A payé</th><th>Sa part</th><th>Solde</th></tr>`+S.D.participants.map(p=>{const b=bal[p];return `<tr><td>${esc(p)}</td><td>${eur(b.paid)}</td><td>${eur(b.owed)}</td><td style="color:${b.net>=0?'var(--sea)':'var(--bad)'}">${b.net>0?'+':''}${eur(b.net)}</td></tr>`}).join('')+'</table>';
 if(un>0)h+=`<p><span class="chip warn">⚠ ${eur(un)} sans payeur défini (non comptés)</span></p>`;
 h+=`<p><button data-a="settle" class="${S.showSettle?'on':''}">⚖ Équilibrer les comptes</button></p>`;
 if(S.showSettle)h+=tr.length?tr.map((t,i)=>`<p>💸 <b>${esc(t.from)}</b> doit <b>${eur(t.amt)}</b> à <b>${esc(t.to)}</b> <button data-a="paid" data-i="${i}">✓ Remboursé</button></p>`).join(''):'<p><span class="chip ok">✅ Les comptes sont équilibrés</span></p>';
 if(S.D.payments.length)h+=`<details><summary>Remboursements effectués (${S.D.payments.length})</summary>`+S.D.payments.map(p=>`<div class="row"><span class="meta" style="flex:1">${esc(p.from)} → ${esc(p.to)} · ${eur(+p.amt)} · ${fmtD(p.date)}</span><button class="ic" data-a="pdel" data-id="${p.id}" aria-label="Annuler ce remboursement" title="Annuler ce remboursement">🗑</button></div>`).join('')+'</details>';
 return h;
}
export function renderBudget(){
 const el=$('#p-budget');if(!el||el.hidden)return;
 const auto=expenses().filter(e=>e.src==='auto');
 el.innerHTML='<div id="b-top">'+budgetTop()+'</div><div class="sec"><span>Dépenses</span><button data-a="sadd">+ Dépense</button></div>'+
  (S.D.spend.map(spendCard).join('')||'<p class="meta">Aucune dépense ajoutée à la main.</p>')+
  (auto.length?'<details><summary>Hébergements et trajets ('+auto.length+')</summary><table class="rc">'+auto.map(e=>`<tr><td>${esc(e.label)}</td><td>${eur(e.amt)}</td><td class="meta">${e.payer?esc(e.payer):'⚠ payeur ?'} → ${esc(e.who.join(', '))}</td></tr>`).join('')+'</table></details>':'');
}
export function init(){
$('#p-budget').addEventListener('click',e=>{
 const ae=e.target.closest('[data-a]');if(!ae)return;
 const a=ae.dataset.a,c=e.target.closest('[data-sid]'),id=c&&c.dataset.sid;
 if(a==='settle'){S.showSettle=!S.showSettle;renderBudget();return}
 if(a==='paid'){const t=S.lastTr[+ae.dataset.i];if(!t)return;S.D.payments.push({id:'p'+Date.now().toString(36),from:t.from,to:t.to,amt:t.amt,date:iso(new Date())});changed();renderBudget();return}
 if(a==='pdel'){S.D.payments=S.D.payments.filter(p=>p.id!==ae.dataset.id);changed();renderBudget();return}
 if(a==='sadd'){const x={id:'x'+Date.now().toString(36),label:'',amt:'',date:iso(new Date()),payer:S.D.participants.includes(C.me)?C.me:'',for:[]};S.D.spend.push(x);spendOpen.add(x.id);changed();renderBudget();return}
 if(a==='stog'){spendOpen.has(id)?spendOpen.delete(id):spendOpen.add(id);renderBudget();return}
 if(a==='sdel'&&confirm('Supprimer cette dépense ?')){S.D.spend=S.D.spend.filter(x=>x.id!==id);changed();renderBudget()}
});
$('#p-budget').addEventListener('input',e=>{
 const c=e.target.closest('[data-sid]');if(!c)return;
 const x=S.D.spend.find(v=>v.id===c.dataset.sid);if(!x)return;
 if(e.target.dataset.sfor!==undefined){
  const names=[...c.querySelectorAll('[data-sfor]')].filter(i=>i.checked).map(i=>i.dataset.sfor);
  x.for=names.length===S.D.participants.length?[]:names;
 }else if(e.target.dataset.sf){x[e.target.dataset.sf]=e.target.value}else return;
 changed();c.querySelector('.hd .tt').innerHTML=spHd(x);
 const top=$('#b-top');if(top)top.innerHTML=budgetTop();
});
}
