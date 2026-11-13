/* Configuration du voyage, onglets, réglages de l’application. */
import {$, addD, esc} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {changed, loadAll, save} from './store.js';
import {toast} from './ui.js';
import {nightsList, renderLodg} from './lodging.js';
import {renderList, renderSum} from './stages.js';
import {renderChat} from './chat.js';
import {renderBudget} from './budget.js';
import {renderCheck} from './checklist.js';
import {renderRecap} from './recap.js';
import {renderHome} from './home.js';

export function showTab(t){
 document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));
 $('#bcfg').classList.toggle('on',t==='trip');
 ['stages','lodg','recap','budget','check','chat','trip'].forEach(k=>$('#p-'+k).hidden=t!==k);
 renderLodg();renderRecap();renderBudget();renderCheck();renderTrip();
}
export const OPT_TABS=[['lodg','Hébergement'],['recap','Récap'],['budget','Budget'],['check','Checklist'],['chat','Discussion']];
export function applyTabs(){
 OPT_TABS.forEach(([k])=>{const b=document.querySelector('.tabs [data-t='+k+']');if(b)b.hidden=S.D.tabsOff.includes(k)});
 const act=document.querySelector('.tabs button.on');if(act&&act.hidden)showTab('stages');
}
export function openSet(){
 $('#c-for').value='';$('#c-url').value='';$('#c-me').value=C.me||'';
 ['owner','repo','branch','path','token'].forEach(k=>$('#c-'+k).value=C[k]||'');
 $('#dlg').showModal();
}
export function renderTrip(){
 $('#t-tabs').innerHTML=OPT_TABS.map(([k,l])=>`<label class="chk"><input type="checkbox" data-tab="${k}" ${S.D.tabsOff.includes(k)?'':'checked'}>${l}</label>`).join('');
 $('#t-name').value=S.D.title||'';$('#t-cover-prev').innerHTML=S.D.cover?`<img class="cvp" src="${esc(S.D.cover)}" alt="">`:'';$('#t-start').value=S.D.start||'';$('#t-end').value=S.D.end||'';$('#t-parts').value=S.D.participants.join(', ');
 const n=nightsList().length;$('#t-info').textContent=n?`${n+1} jours, ${n} nuits.`:'Renseigne les dates pour calculer la durée.';
}
export function resizeImg(file,maxW=640){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,maxW/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
export function init(){
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
$('#bcfg').onclick=()=>showTab($('#p-trip').hidden?'trip':'stages');
$('#bset2').onclick=openSet;
$('#bset').onclick=openSet;
$('#c-link').onclick=async()=>{
 const o={owner:$('#c-owner').value.trim(),repo:$('#c-repo').value.trim(),branch:$('#c-branch').value.trim()||'main',path:$('#c-path').value.trim()||'data.json',token:$('#c-token').value.trim(),me:$('#c-for').value.trim()};
 if(!o.owner||!o.repo||!o.token)return toast('Renseigne d’abord le dépôt et le token ci-dessus.');
 const b=btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const u=location.origin+location.pathname+'#cfg='+b;
 $('#c-url').value=u;
 try{await navigator.clipboard.writeText(u);toast('Lien copié. Envoie-le par un canal privé.')}
 catch(e){$('#c-url').select();toast('Lien généré : copie-le depuis le champ.')}
};
$('#c-url').onclick=e=>e.target.select();
$('#c-x').onclick=()=>$('#dlg').close();
$('#c-ok').onclick=()=>{
 C.me=$('#c-me').value.trim()||C.me||'Moi';
 ['owner','repo','branch','path','token'].forEach(k=>C[k]=$('#c-'+k).value.trim());
 localStorage.setItem('tp_cfg',JSON.stringify(C));
 $('#dlg').close();toast('Réglages enregistrés dans ce navigateur.');
 (async()=>{if(!S.curId){try{await loadAll()}catch(e){}renderHome()}else renderChat()})();
};
$('#t-name').addEventListener('input',e=>{S.D.title=e.target.value;$('#title').value=S.D.title;document.title=S.D.title;changed()});
['start','end'].forEach(k=>$('#t-'+k).addEventListener('change',e=>{
 S.D[k]=e.target.value;if(S.D.start&&S.D.end&&S.D.end<S.D.start)toast('La date d’arrivée précède le départ.');
 changed();renderSum();renderTrip();
}));
$('#t-parts').addEventListener('change',e=>{
 const p=e.target.value.split(',').map(x=>x.trim()).filter(Boolean);if(!p.length)return toast('Il faut au moins un participant.');
 S.D.participants=p;
 if(C.me&&!p.includes(C.me))toast('Ton prénom (« '+C.me+' ») n’est pas dans la liste des participants.');
 changed();renderChat();renderTrip();
});
$('#t-fill').onclick=()=>{
 if(!S.D.start)return toast('Renseigne d’abord la date de départ.');
 S.D.stages.forEach((s,i)=>{if(!s.date)s.date=addD(S.D.start,i)});changed();renderList();
};
$('#title').onclick=()=>showTab('trip');
$('#t-tabs').addEventListener('change',e=>{const k=e.target.dataset.tab;if(!k)return;S.D.tabsOff=S.D.tabsOff.filter(x=>x!==k);if(!e.target.checked)S.D.tabsOff.push(k);changed();applyTabs()});
$('#t-cover').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{S.D.cover=await resizeImg(f);changed();renderTrip()}catch(x){toast('Image illisible.')}e.target.value=''});
$('#t-cover-del').onclick=()=>{delete S.D.cover;changed();renderTrip()};
$('#bsave').onclick=save;
addEventListener('beforeunload',e=>{if(S.dirty){e.preventDefault();e.returnValue=''}});
}
