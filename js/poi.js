/* Points d’intérêt : affichage, chargement par tronçons en arrière-plan, édition. */
import {$, em, esc, fetchT, sleep} from './lib/util.js';
import {S} from './state.js';
import {changed, touched} from './store.js';
import {status, toast} from './ui.js';
import {covLayer, map, poiLayer} from './mapcore.js';
import {covSig, dist, okRoute, stLine} from './lib/stage.js';
import {renderList} from './stages.js';
import {POI_T, poiQuery, poiType} from './lib/poi.js';
import {chunkInfo, proj} from './lib/geo.js';

export const poiShow=Object.assign({water:1,camp:1,shelter:1,gite:1,bnb:1,hotel:1,wc:1,bar:1,resto:1,shop:1,view:1,danger:1,other:1},JSON.parse(localStorage.getItem('tp_poishow')||'{}'));
export function locate(lat,lng){
 let best=null;
 S.D.stages.forEach(s=>{if(s.points.length<2)return;const pr=proj(okRoute(s)?s.route:s.points,[lat,lng]);if(!best||pr.d<best.off)best={sid:s.id,km:+pr.km.toFixed(2),off:Math.round(pr.d)}});
 return best&&best.off<=1500?best:null;
}
export function drawPois(){
 poiLayer.clearLayers();if(!S.poiOn)return;
 (S.D.pois||[]).forEach(x=>{
  if(!poiShow[x.type])return;
  const t=POI_T[x.type]||POI_T.other,j=S.D.stages.findIndex(s=>s.id===x.sid);
  const m=L.marker([x.lat,x.lng],{icon:L.divIcon({className:'',iconSize:[26,26],html:`<div class="poi">${t.e}</div>`})}).addTo(poiLayer);
  const box=document.createElement('div');
  box.innerHTML=`<b>${esc(x.name||t.l)}</b><br><span class="meta">${t.l}${j>=0?' · J'+(j+1)+' · km '+x.km+' · à '+x.off+' m':''}</span>${x.note?'<br>'+esc(x.note):''}${x.src==='osm'?'<br><span class="meta">© OpenStreetMap</span>':''}<br>`;
  const b=document.createElement('button');b.textContent='✏ Modifier';b.onclick=()=>{map.closePopup();openPoiDlg(x.id)};box.appendChild(b);
  m.bindPopup(box);
 });
}
export const poiLine=s=>{
 const c={};(S.D.pois||[]).filter(x=>x.sid===s.id).forEach(x=>c[x.type]=(c[x.type]||0)+1);
 const k=Object.keys(c);return k.length?`<div class="meta">${k.map(t=>(POI_T[t]||POI_T.other).e+' '+c[t]).join(' · ')} le long du tracé</div>`:'';
};
export function poiRecapHtml(){
 const P=S.D.pois||[];if(!P.length)return'';
 const cnt={};P.forEach(x=>cnt[x.type]=(cnt[x.type]||0)+1);
 let h='<div class="sec"><span>Points d’intérêt</span></div><p class="meta">'+Object.entries(cnt).map(([k,n])=>(POI_T[k]||POI_T.other).e+' '+n).join(' · ')+'</p>';
 if(P.some(x=>x.type==='water')){
  const W=[];
  S.D.stages.forEach((s,i)=>{if(s.points.length<2)return;const L=dist(s),ws=P.filter(x=>x.type==='water'&&x.sid===s.id).map(x=>x.km).sort((a,b)=>a-b),pts=[0,...ws,L];let g=0;for(let j=1;j<pts.length;j++)g=Math.max(g,pts[j]-pts[j-1]);W.push({i,g,n:ws.length})});
  if(W.length)h+='<table class="rc"><tr><th>Jour</th><th>💧</th><th>Plus long sans eau</th></tr>'+W.map(x=>`<tr><td>J${x.i+1}</td><td>${x.n}</td><td>${x.g.toFixed(1)} km</td></tr>`).join('')+'</table><p class="meta">Calculé d’après les points d’eau enregistrés le long de chaque tracé.</p>';
 }
 return h;
}
export async function overpassQ(q,pref){
 const M=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'],errs=[];
 for(let pass=0;pass<2;pass++){
  for(let k=0;k<M.length;k++){
   const u=M[((pref!=null?pref:S.ovStart)+k)%M.length];
   try{
    const r=await fetchT(u,28000,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
    if(!r.ok){errs.push(u.split('/')[2]+' : '+r.status);continue}
    const j=await r.json();if(pref==null)S.ovStart=(S.ovStart+k)%M.length;return j;
   }catch(e){errs.push(u.split('/')[2]+' : '+(e.name==='AbortError'?'délai dépassé':e.message))}
  }
  if(pass===0)await sleep(3000);
 }
 throw new Error(errs.slice(-3).join(' · '));
}
export const covOpen=new Set();
export function chunkStatus(s,i){
 const j=S.poiJob;
 if(j&&j.T===S.D){const t=j.tasks.find(x=>x.sid===s.id&&x.i===i&&!x.done);if(t)return j.running.has(s.id+':'+i)?'run':'wait'}
 const cov=(S.D.poiCov||{})[s.id];
 if(!cov)return'none';if(cov.sig!==covSig(s))return'stale';
 return cov.err[i]?'err':(cov.ok[i]?'ok':'none');
}
export const COV_L={run:'⏳ en cours',wait:'⏳ en attente',err:'⚠ échec',stale:'🔄 tracé modifié',none:'— à charger'};
export const covLabel=(st,s,k)=>st==='ok'?'✅ '+(((S.D.poiCov||{})[s.id].ok[k]||{}).c||0)+' point(s)':st==='err'&&((S.D.poiCov||{})[s.id]||{ok:{}}).ok[k]?'⚠ échec (anciens points conservés)':COV_L[st];
export const covChip=(st,s,k)=>`<span class="chip ${st==='ok'?'ok':(st==='run'||st==='wait')?'na':'warn'}">${covLabel(st,s,k)}</span>`;
export function renderCov(){
 const el=$('#pd-cov');if(!el)return;
 const rows=[];let tot=0,okc=0;
 S.D.stages.forEach((s,i)=>{
  if(s.points.length<2)return;
  const ch=chunkInfo(stLine(s)),st=ch.map((_,k)=>chunkStatus(s,k)),o=st.filter(x=>x==='ok').length;
  tot+=ch.length;okc+=o;
  rows.push(`<details data-cov="${s.id}" ${covOpen.has(s.id)?'open':''}><summary>J${i+1} · ${esc(s.name)} <span class="chip ${o===ch.length?'ok':'warn'}">${o===ch.length?'✅':'⚠'} ${o}/${ch.length}</span></summary>`+
   ch.map((c,k)=>`<div class="cvr"><span>Tronçon ${k+1} <span class="meta">km ${(c.a/1000).toFixed(1)}–${(c.b/1000).toFixed(1)}</span></span>${covChip(st[k],s,k)}<button class="ic" data-cv="chunk" data-sid="${s.id}" data-i="${k}" title="Mettre à jour ce tronçon" aria-label="Mettre à jour ce tronçon">↻</button></div>`).join('')+
   `<button data-cv="day" data-sid="${s.id}">↻ Mettre à jour tout le jour</button></details>`);
 });
 el.innerHTML=rows.length?`<p class="meta">${tot} tronçon(s) : ${okc} chargé(s), ${tot-okc} à charger ou à mettre à jour.</p>`+rows.join(''):'<p class="meta">Trace d’abord un itinéraire (au moins 2 repères) pour voir les tronçons.</p>';
}
export function drawCov(){
 covLayer.clearLayers();
 const bt=$('#bcov');bt.classList.toggle('on',S.covOn);
 if(!S.covOn){bt.textContent='🧩 Tronçons';return}
 let miss=0;
 S.D.stages.forEach((s,i)=>{
  if(s.points.length<2)return;
  chunkInfo(stLine(s)).forEach((c,k)=>{
   const st=chunkStatus(s,k),ok=st==='ok',busy=st==='run'||st==='wait',col=ok?'#2f9e44':st==='err'?'#d6336c':busy?'#1c7ed6':'#f08c00';
   if(!ok)miss++;
   const pl=L.polyline(c.pts,{color:col,weight:ok?4:8,opacity:ok?.55:.85,dashArray:ok?null:'2 10',lineCap:'round'}).addTo(covLayer);
   if(!ok&&!busy){
    const box=document.createElement('div');
    box.innerHTML=`<b>J${i+1} · tronçon ${k+1}</b><br><span class="meta">km ${(c.a/1000).toFixed(1)}–${(c.b/1000).toFixed(1)} · ${COV_L[st]}</span><br>`;
    const b=document.createElement('button');b.textContent='↻ Charger ce tronçon';b.onclick=()=>{map.closePopup();startPoi('chunk',s.id,k)};
    box.appendChild(b);pl.bindPopup(box);
   }
  });
 });
 bt.textContent='🧩 À charger : '+miss;
}
export function setCov(v){
 S.covOn=v;localStorage.setItem('tp_cov',v?'1':'0');drawCov();
 if(v)toast('Orange : à charger · Bleu : en cours · Rouge : échec · Vert : chargé. Touche un tronçon pour le charger.');
}
export function updJobUI(){
 const j=S.poiJob,b=$('#poistat');
 if(!j){b.hidden=true;$('#pd-search').textContent='⬇ Charger les tronçons manquants'}
 else{
  b.hidden=false;b.textContent='⏳ Points '+j.done+'/'+j.total+(j.added?' · +'+j.added:'');
  $('#pd-search').textContent='⏹ Arrêter le chargement';
  $('#pd-msg').textContent='Chargement en arrière-plan : '+j.done+'/'+j.total+' tronçons, '+j.added+' point(s) trouvé(s)'+(j.fail?', '+j.fail+' échec(s) (nouvel essai à la fin)':'')+'.';
 }
 if($('#pdlg').hasAttribute('open'))renderCov();
 drawCov();
}
export function stopPoi(){if(S.poiJob){S.poiJob.cancel=true;toast('Chargement arrêté après les tronçons en cours.')}}
export function covRec(T,t,job){
 if(covSig(t.s)!==t.sig)return null;
 let c=T.poiCov[t.sid];
 if(!c||c.sig!==t.sig)c=T.poiCov[t.sid]={sig:t.sig,R:job.R,cats:job.cats.join(','),n:t.n,ok:{},err:{}};
 return c;
}
export async function runPoi(job){
 const T=job.T,failed=[];
 const doTask=async(t,pref)=>{
  const j=await overpassQ(poiQuery(job.cats,job.R,t.pts),pref);
  let n=0;
  (j.elements||[]).forEach(el=>{
   const tg=el.tags||{};if(tg.drinking_water==='no')return;
   const lat=el.lat!=null?el.lat:(el.center&&el.center.lat),lng=el.lon!=null?el.lon:(el.center&&el.center.lon);
   if(lat==null||lng==null)return;
   const pr=proj(t.line,[lat,lng]);if(pr.d>job.R+30)return;
   n++;
   const osm=el.type+'/'+el.id;if(T.pois.some(x=>x.osm===osm))return;
   T.pois.push({id:'o'+el.type[0]+el.id,type:poiType(tg),name:tg.name||'',lat:+(+lat).toFixed(5),lng:+(+lng).toFixed(5),note:tg.opening_hours?'Horaires : '+tg.opening_hours:'',src:'osm',osm,sid:t.sid,km:+pr.km.toFixed(2),off:Math.round(pr.d)});
   job.added++;
  });
  const c=covRec(T,t,job);if(c){c.ok[t.i]={t:Date.now(),c:n};delete c.err[t.i];c.R=job.R;c.cats=job.cats.join(',')}
  touched.add(T.id);S.dirty=true;
 };
 const refresh=()=>{if(S.curId===T.id){status('● Non enregistré');drawPois();renderList()}};
 const worker=async w=>{
  while(!job.cancel&&job.next<job.tasks.length){
   const t=job.tasks[job.next++],k=t.sid+':'+t.i;job.running.add(k);updJobUI();
   try{await doTask(t,w)}
   catch(e){job.lastErr=em(e);failed.push(t);job.fail++;const c=covRec(T,t,job);if(c)c.err[t.i]=job.lastErr}
   job.running.delete(k);t.done=true;job.done++;updJobUI();
   if(job.done%4===0)refresh();
   await sleep(700);
  }
 };
 await Promise.all([worker(0),worker(1)]);
 if(!job.cancel&&failed.length){
  await sleep(5000);
  for(const t of failed){
   if(job.cancel)break;
   const k=t.sid+':'+t.i;t.done=false;job.running.add(k);updJobUI();
   try{await doTask(t,0);job.fail--}catch(e){job.lastErr=em(e)}
   job.running.delete(k);t.done=true;updJobUI();await sleep(700);
  }
 }
 refresh();
 S.poiJob=null;updJobUI();updPoiCount();
 const msg=job.cancel?'Chargement arrêté : '+job.added+' point(s) ajouté(s).':job.added+' point(s) d’intérêt ajouté(s)'+(job.fail>0?' ; '+job.fail+' tronçon(s) en échec ('+job.lastErr+') : relance-les depuis la liste.':'.');
 $('#pd-msg').textContent=msg;toast(msg);
}
export function buildTasks(mode,sid,idx){
 const tasks=[];
 S.D.stages.forEach(s=>{
  if(s.points.length<2||(sid&&s.id!==sid))return;
  const line=stLine(s),ch=chunkInfo(line),sig=covSig(s);
  ch.forEach((c,i)=>{
   if(idx!=null&&i!==idx)return;
   if(mode==='missing'&&chunkStatus(s,i)==='ok')return;
   tasks.push({s,sid:s.id,i,n:ch.length,sig,line,pts:c.pts,done:false});
  });
 });
 return tasks;
}
export function startPoi(mode,sid,idx){
 if(S.poiJob){toast('Un chargement est déjà en cours : arrête-le ou attends sa fin.');return}
 mode=mode||'missing';
 const msg=$('#pd-msg'),cats=Object.keys(POI_T).filter(k=>poiShow[k]&&POI_T[k].q);
 if(!cats.length){msg.textContent='Coche au moins un type à charger (eau, commerces…).';return}
 const tasks=buildTasks(mode,sid,idx);
 if(!tasks.length){msg.textContent=S.D.stages.some(s=>s.points.length>1)?'Tous les tronçons sont déjà chargés.':'Trace d’abord un itinéraire (au moins 2 repères sur le jour).';return}
 S.poiJob={T:S.D,tasks,cats,R:+$('#pd-r').value,total:tasks.length,done:0,added:0,fail:0,cancel:false,lastErr:'',running:new Set(),next:0};
 updJobUI();
 toast('Chargement lancé en arrière-plan ('+tasks.length+' tronçon(s)). Tu peux fermer cette fenêtre et continuer.');
 runPoi(S.poiJob);
}
export function updPoiCount(){const n=S.D.pois.length,o=S.D.pois.filter(x=>x.src==='osm').length;$('#pd-count').textContent=n+' point(s) enregistré(s) dont '+o+' importé(s).'}
export function openPoiMgr(){
 $('#pd-on').checked=S.poiOn;
 $('#pd-cats').innerHTML=Object.entries(POI_T).map(([k,t])=>`<label class="pcat${poiShow[k]?' on':''}"><input type="checkbox" data-pc="${k}" ${poiShow[k]?'checked':''}><span class="pe">${t.e}</span><span class="pl">${t.l}</span></label>`).join('');
 $('#pd-msg').textContent='';updPoiCount();updJobUI();renderCov();$('#pdlg').showModal();
}
export function openPoiDlg(id,ll){
 if(id){const x=S.D.pois.find(v=>v.id===id);if(!x)return;S.PE={obj:x,isNew:false}}
 else{
  const t={id:'p'+Date.now().toString(36),type:'water',name:'',lat:+ll.lat.toFixed(5),lng:+ll.lng.toFixed(5),note:'',src:'me'};
  const lc=locate(t.lat,t.lng);if(lc){t.sid=lc.sid;t.km=lc.km;t.off=lc.off}
  S.PE={obj:t,isNew:true};
 }
 const x=S.PE.obj,j=S.D.stages.findIndex(v=>v.id===x.sid);
 $('#po-name').value=x.name||'';$('#po-type').value=x.type;$('#po-note').value=x.note||'';
 $('#po-info').textContent=(x.src==='osm'?'Source : OpenStreetMap':'Ajouté à la main')+(j>=0?' · J'+(j+1)+' · km '+x.km+' · à '+x.off+' m de l’itinéraire':'');
 $('#po-del').hidden=S.PE.isNew;$('#podlg').showModal();
}
export function init(){
$('#po-type').innerHTML=Object.entries(POI_T).map(([k,t])=>`<option value="${k}">${t.e} ${t.l}</option>`).join('');
$('#pd-cov').addEventListener('toggle',e=>{const d=e.target;if(d.tagName!=='DETAILS')return;d.open?covOpen.add(d.dataset.cov):covOpen.delete(d.dataset.cov)},true);
$('#pd-cov').addEventListener('click',e=>{
 const b=e.target.closest('[data-cv]');if(!b)return;
 if(b.dataset.cv==='chunk')startPoi('chunk',b.dataset.sid,+b.dataset.i);
 if(b.dataset.cv==='day')startPoi('day',b.dataset.sid);
});
$('#bcov').onclick=()=>setCov(!S.covOn);
$('#pd-covmap').onclick=()=>{setCov(true);$('#pdlg').close()};
$('#bpoi').onclick=openPoiMgr;
$('#pd-x').onclick=()=>$('#pdlg').close();
$('#pd-on').onchange=e=>{S.poiOn=e.target.checked;localStorage.setItem('tp_poi',S.poiOn?'1':'0');drawPois()};
$('#pd-cats').addEventListener('change',e=>{const k=e.target.dataset.pc;if(!k)return;poiShow[k]=e.target.checked?1:0;e.target.closest('.pcat').classList.toggle('on',e.target.checked);localStorage.setItem('tp_poishow',JSON.stringify(poiShow));drawPois()});
$('#pd-search').onclick=()=>S.poiJob?stopPoi():startPoi();
$('#poistat').onclick=openPoiMgr;
$('#pd-add').onclick=()=>{$('#pdlg').close();S.addPoiMode=true;map.getContainer().style.cursor='crosshair';toast('Touche la carte à l’endroit du point.')};
$('#pd-clear').onclick=()=>{if(!confirm('Supprimer tous les points importés d’OpenStreetMap ? (tes points ajoutés à la main sont conservés)'))return;S.D.pois=S.D.pois.filter(x=>x.src!=='osm');S.D.poiCov={};changed();drawPois();renderList();updPoiCount();renderCov();drawCov()};
$('#po-x').onclick=()=>$('#podlg').close();
$('#po-ok').onclick=()=>{
 const x=S.PE.obj;x.name=$('#po-name').value.trim();x.type=$('#po-type').value;x.note=$('#po-note').value.trim();
 if(S.PE.isNew)S.D.pois.push(x);
 changed();drawPois();renderList();$('#podlg').close();
};
$('#po-del').onclick=()=>{if(!confirm('Supprimer ce point ?'))return;S.D.pois=S.D.pois.filter(v=>v!==S.PE.obj);changed();drawPois();renderList();$('#podlg').close()};
}
