/* Revêtement du parcours (OpenStreetMap) : analyse par tronçons en arrière-plan, bilan dans le Récap, coloration sur la carte. */
import {$, em, esc, sleep} from './lib/util.js';
import {S} from './state.js';
import {touched} from './store.js';
import {status, toast} from './ui.js';
import {map} from './mapcore.js';
import {chunkInfo} from './lib/geo.js';
import {covSig, stLine} from './lib/stage.js';
import {cumul, sliceLine} from './lib/track.js';
import {SURF, mergeRle, prepWays, sampleTypes, summarize, surfQuery, toRle} from './lib/surface.js';
import {overpassQ} from './poi.js';
import {renderRecap} from './recap.js';

export const surfLayer=L.layerGroup().addTo(map);
let surfOn=localStorage.getItem('tp_surf')==='1',job=null;
const fk=v=>(Math.round(v*10)/10).toString().replace('.',',');
const ORDER=['paved','gravel','dirt','rock','path','road','unknown'];

async function analyzeStage(s,T){
 const line=stLine(s),sig=covSig(s),ch=chunkInfo(line,4000),parts=[];
 for(let i=0;i<ch.length;i++){
  if(job.cancel)throw new Error('arrêtée');
  job.i=i+1;job.n=ch.length;renderRecap();
  const j=await overpassQ(surfQuery(ch[i].pts),i%2);
  parts.push(...toRle(sampleTypes(ch[i].pts,prepWays(j.elements),40,25),40,ch[i].a,ch[i].b-ch[i].a));
  await sleep(600);
 }
 s.surf={sig,rle:mergeRle(parts),at:Date.now()};
 touched.add(T.id);S.dirty=true;status('● Non enregistré');
}
export async function startSurf(ids){
 if(job){toast('Une analyse est déjà en cours.');return}
 const T=S.D,list=T.stages.filter(s=>ids.includes(s.id)&&s.points.length>1);
 if(!list.length){toast('Aucun tracé à analyser.');return}
 job={cur:null,i:0,n:0,cancel:false};let fail=0,last='';
 toast('Analyse du revêtement lancée en arrière-plan.');
 for(const s of list){
  job.cur=s.id;renderRecap();
  try{await analyzeStage(s,T)}catch(e){if(job.cancel)break;fail++;last=em(e)}
  drawSurf();
 }
 const stopped=job.cancel;job=null;renderRecap();drawSurf();
 toast(stopped?'Analyse arrêtée.':fail?'Analyse terminée avec '+fail+' échec(s) ('+last+') : relance les jours concernés (↻).':'Analyse du revêtement terminée.');
}
const valid=s=>s.surf&&s.surf.sig===covSig(s);
export function surfRecapHtml(){
 const days=S.D.stages.map((s,i)=>({s,i})).filter(x=>x.s.points.length>1);
 if(!days.length)return'';
 let h='<div class="sec"><span>Revêtement du parcours</span><button data-surf="all">'+(job?'⏹ Arrêter':'🔍 Tout analyser')+'</button></div>';
 const tot={};let totKm=0;
 h+=days.map(({s,i})=>{
  let cell='<span class="meta">non analysé</span>';
  if(job&&job.cur===s.id)cell=`<span class="meta">⏳ ${job.i}/${job.n}</span>`;
  else if(valid(s)){
   const {km,total}=summarize(s.surf.rle);
   ORDER.forEach(t=>{if(km[t]){tot[t]=(tot[t]||0)+km[t];totKm+=km[t]}});
   const top=ORDER.filter(t=>km[t]).sort((a,b)=>km[b]-km[a]).slice(0,2).map(t=>Math.round(km[t]/total*100)+' % '+SURF[t].l.split(' (')[0].toLowerCase()).join(' · ');
   cell=`<div class="sb">${ORDER.filter(t=>km[t]).map(t=>`<i style="width:${(km[t]/total*100).toFixed(1)}%;background:${SURF[t].c}" title="${esc(SURF[t].l)} : ${fk(km[t])} km"></i>`).join('')}</div><span class="meta">${esc(top)}</span>`;
  }else if(s.surf)cell='<span class="meta">tracé modifié : à relancer</span>';
  return `<div class="srow"><span>J${i+1}</span><div class="sbc">${cell}</div><button class="ic" data-surf="${s.id}" title="Analyser ce jour" aria-label="Analyser ce jour">↻</button></div>`;
 }).join('');
 if(totKm>0)h+='<div class="meta" style="margin-top:6px">'+ORDER.filter(t=>tot[t]).map(t=>`<span class="sdot" style="background:${SURF[t].c}"></span>${esc(SURF[t].l)} : ${fk(tot[t])} km (${Math.round(tot[t]/totKm*100)} %)`).join('<br>')+'</div>';
 return h+'<p class="meta">D’après OpenStreetMap : le revêtement n’est pas toujours renseigné (« non renseigné » = sentier ou route sans information).</p>';
}
export function drawSurf(){
 surfLayer.clearLayers();
 $('#bsurf').classList.toggle('on',surfOn);
 if(!surfOn)return;
 S.D.stages.forEach(s=>{
  if(!valid(s)||s.points.length<2||(S.view==='day'&&s.id!==S.sel))return;
  const line=stLine(s),cum=cumul(line);
  s.surf.rle.forEach(([a,b,t])=>{if(b-a>=1)L.polyline(sliceLine(line,cum,a,b),{color:SURF[t].c,weight:7,opacity:.9,interactive:false}).addTo(surfLayer)});
 });
}
export function setSurf(v){
 surfOn=v;localStorage.setItem('tp_surf',v?'1':'0');drawSurf();
 if(v)toast(S.D.stages.some(valid)?'Gris : revêtu · Orange : gravier · Brun : terre · Violet : rocher · Vert : sentier non renseigné.':'Aucun revêtement analysé : lance l’analyse depuis l’onglet Récap.');
}
export function init(){
 $('#bsurf').onclick=()=>setSurf(!surfOn);
 window.addEventListener('tp:redraw',drawSurf);
 $('#p-recap').addEventListener('click',e=>{
  const b=e.target.closest('[data-surf]');if(!b)return;
  const v=b.dataset.surf;
  if(v==='all'){if(job)job.cancel=true;else startSurf(S.D.stages.map(s=>s.id))}else startSurf([v]);
 });
 drawSurf();
}
