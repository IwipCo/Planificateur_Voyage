/* Liste des objets à emporter. */
import {$, esc} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed} from './store.js';

export const ckWho=(v)=>`<option value="">À attribuer</option><option value="*" ${v==='*'?'selected':''}>Tous</option>`+S.D.participants.map(p=>`<option value="${esc(p)}" ${v===p?'selected':''}>${esc(p)}</option>`).join('');
export const ckCount=()=>{const n=S.D.checklist.length,d=S.D.checklist.filter(x=>x.done).length;return n?`${d}/${n} prêts`:'Aucun objet pour l’instant'};
export function renderCheck(){
 const el=$('#p-check');if(!el||el.hidden)return;
 const groups=[['','À attribuer'],['*','Tous'],...S.D.participants.map(p=>[p,p])];
 let h=`<p class="meta" id="ck-count">${ckCount()}</p><div class="row"><input id="ck-new" placeholder="Objet à prendre…"><select id="ck-who">${ckWho(S.D.participants.includes(C.me)?C.me:'')}</select><button id="ck-add" class="pri">+</button></div>`;
 groups.forEach(([k,lb])=>{
  const L=S.D.checklist.filter(x=>(x.who||'')===k||(k===''&&x.who&&x.who!=='*'&&!S.D.participants.includes(x.who)));
  if(!L.length)return;
  h+=`<div class="sec"><span>${esc(lb)}</span><span class="meta">${L.filter(x=>x.done).length}/${L.length}</span></div>`+L.map(x=>`<div class="ck" data-id="${x.id}"><input type="checkbox" data-ck="done" ${x.done?'checked':''} aria-label="Pris"><input data-ck="text" value="${esc(x.text)}"><select data-ck="who">${ckWho(x.who||'')}</select><button class="ic" data-a="ckdel" aria-label="Supprimer" title="Supprimer">🗑</button></div>`).join('');
 });
 el.innerHTML=h;
}
export function ckAdd(){
 const inp=$('#ck-new'),t=inp.value.trim();if(!t)return;
 S.D.checklist.push({id:'k'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),text:t,who:$('#ck-who').value,done:false});
 changed();renderCheck();$('#ck-new').focus();
}
export function init(){
$('#p-check').addEventListener('click',e=>{
 if(e.target.closest('#ck-add'))return ckAdd();
 const b=e.target.closest('[data-a=ckdel]');if(!b)return;
 const id=b.closest('.ck').dataset.id;S.D.checklist=S.D.checklist.filter(x=>x.id!==id);changed();renderCheck();
});
$('#p-check').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ck-new')ckAdd()});
$('#p-check').addEventListener('input',e=>{
 const f=e.target.dataset.ck,row=e.target.closest('.ck');if(!f||!row)return;
 const it=S.D.checklist.find(x=>x.id===row.dataset.id);if(!it)return;
 if(f==='done'){it.done=e.target.checked;changed();$('#ck-count').textContent=ckCount();return}
 it[f]=e.target.value;changed();if(f==='who')renderCheck();
});
}
