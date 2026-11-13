/* Discussion générale et par jour. */
import {$, esc} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed, refresh, save} from './store.js';

export const msgHtml=m=>`<div class="m ${m.author===C.me?'me':''}"><small>${esc(m.author)} · ${new Date(m.ts).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}</small>${esc(m.text).replace(/\n/g,'<br>')}</div>`;
export const chatHtml=s=>(s.chat||[]).map(msgHtml).join('')||'<p class="meta">Pas encore de message.</p>';
export function renderStageChats(){
 document.querySelectorAll('.sc').forEach(el=>{
  const s=S.D.stages.find(x=>x.id===el.dataset.id);if(!s)return;
  el.innerHTML=chatHtml(s);el.scrollTop=el.scrollHeight;
  el.closest('details').querySelector('summary').textContent='💬 Discussion ('+(s.chat||[]).length+')';
 });
}
export function renderChat(){
 renderStageChats();
 const box=$('#msgs');
 box.innerHTML=S.D.messages.map(m=>`<div class="m ${m.author===C.me?'me':''}"><small>${esc(m.author)} · ${new Date(m.ts).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}</small>${esc(m.text).replace(/\n/g,'<br>')}</div>`).join('')||'<p class="meta">Pas encore de message.</p>';
}
export async function send(){
 const t=$('#mtxt').value.trim();if(!t)return;
 S.D.messages.push({id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),author:C.me,text:t,ts:Date.now()});
 $('#mtxt').value='';renderChat();changed();await save();
}
export function init(){
$('#msend').onclick=send;
$('#mtxt').addEventListener('keydown',e=>{if(e.key==='Enter')send()});
$('#bref').onclick=()=>refresh(true);
setInterval(()=>refresh(false),60000);
}
