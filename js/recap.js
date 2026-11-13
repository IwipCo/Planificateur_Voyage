/* Récapitulatif : statistiques, profil total, points à vérifier. */
import {$, COL, addD, esc, fmtD, iso} from './lib/util.js';
import {S} from './state.js';
import {dist} from './lib/stage.js';
import {coverMap, lodgOf, nightsList} from './lodging.js';
import {transCheck} from './transports.js';
import {expenses} from './budget.js';
import {poiRecapHtml} from './poi.js';

export function profAll(){
 const parts=S.D.stages.map((s,i)=>({s,i})).filter(x=>x.s.elev&&x.s.elev.d&&x.s.elev.d.length>1);
 if(!parts.length)return'';
 let off=0,lo=1e9,hi=-1e9;const seg=[];
 parts.forEach(({s,i})=>{const e=s.elev,dm=e.d[e.d.length-1]||0.01;seg.push({i,off,dm,e});off+=dm;lo=Math.min(lo,e.min);hi=Math.max(hi,e.max)});
 const W=320,H=120,P=6,B=16,X=d=>P+(W-2*P)*d/off,Y=z=>H-B-(H-B-P)*(z-lo)/Math.max(10,hi-lo);
 const g=seg.map(sg=>{
  const pts=sg.e.d.map((d,k)=>X(sg.off+d).toFixed(1)+','+Y(sg.e.z[k]).toFixed(1)).join(' '),col=COL[sg.i%COL.length];
  const x0=X(sg.off),x1=X(sg.off+sg.dm);
  return `<polygon points="${x0.toFixed(1)},${H-B} ${pts} ${x1.toFixed(1)},${H-B}" fill="${col}" opacity=".35"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6"/><line x1="${x0.toFixed(1)}" x2="${x0.toFixed(1)}" y1="${P}" y2="${H-B}" stroke="var(--line)" stroke-dasharray="3 3"/><text x="${((x0+x1)/2).toFixed(1)}" y="${H-3}" text-anchor="middle" font-size="9" fill="var(--mute)">J${sg.i+1}</text>`}).join('');
 return `<div class="sec"><span>Profil du parcours</span></div><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Profil altimétrique total">${g}</svg><div class="meta" style="display:flex;justify-content:space-between"><span>min ${Math.round(lo)} m</span><span>${off.toFixed(1)} km</span><span>max ${Math.round(hi)} m</span></div>`;
}
export function checksHtml(){
 const m=[],ns=nightsList();
 if(ns.length){const cm=coverMap(),miss=ns.filter(d=>!cm[d]).length;if(miss)m.push(miss+' nuit(s) sans hébergement')}
 m.push(...transCheck());
 const td=iso(new Date()),lim=addD(td,14);
 S.D.stages.forEach((s,i)=>{const L=lodgOf(s);if(L.cancelBy&&(L.status==='booked'||L.status==='todo')&&L.cancelBy>=td&&L.cancelBy<=lim)m.push('J'+(i+1)+' '+(L.name||'hébergement')+' : annulation gratuite jusqu’au '+fmtD(L.cancelBy))});
 const np=expenses().filter(e=>!e.payer).length;if(np)m.push(np+' dépense(s) sans payeur défini');
 return m.length?'<div class="sec"><span>À vérifier</span></div>'+m.map(x=>`<p><span class="chip warn">⚠ ${esc(x)}</span></p>`).join(''):'<p><span class="chip ok">✅ Rien à signaler</span></p>';
}
export function renderRecap(){
 const el=$('#p-recap');if(!el||el.hidden)return;
 const A=S.D.stages.map((s,i)=>({s,i,km:s.points.length>1?dist(s):0})).filter(x=>x.km>0);
 let h=checksHtml();
 if(!A.length)h+='<p class="meta">Trace des jours sur la carte pour voir les statistiques.</p>';
 else{
  const tot=A.reduce((a,x)=>a+x.km,0),E=A.filter(x=>x.s.elev&&x.s.elev.z&&x.s.elev.z.length);
  const lg=A.reduce((a,x)=>x.km>a.km?x:a),sh=A.reduce((a,x)=>x.km<a.km?x:a);
  const T=(l,v)=>`<div class="stat"><span class="meta">${l}</span><b>${v}</b></div>`;
  let t=T('Jours',S.D.stages.length)+(S.D.start&&S.D.end?T('Période',fmtD(S.D.start)+' → '+fmtD(S.D.end)):'')+T('Distance totale',tot.toFixed(1)+' km')+T('Moyenne / jour',(tot/A.length).toFixed(1)+' km')+T('Jour le plus long','J'+(lg.i+1)+' · '+lg.km.toFixed(1)+' km')+T('Jour le plus court','J'+(sh.i+1)+' · '+sh.km.toFixed(1)+' km');
  if(E.length){
   const up=E.reduce((a,x)=>a+x.s.elev.up,0),dn=E.reduce((a,x)=>a+x.s.elev.dn,0),hd=E.reduce((a,x)=>x.s.elev.up>a.s.elev.up?x:a);
   t+=T('Dénivelé +',up+' m')+T('Dénivelé −',dn+' m')+T('Altitude max',Math.max(...E.map(x=>x.s.elev.max))+' m')+T('Altitude min',Math.min(...E.map(x=>x.s.elev.min))+' m')+T('D+ moyen / jour',Math.round(up/E.length)+' m')+T('Jour le plus dur','J'+(hd.i+1)+' · +'+hd.s.elev.up+' m');
  }
  h+='<div class="sec"><span>Statistiques</span></div><div class="stats">'+t+'</div>';
  if(E.length<A.length)h+=`<p class="meta">Dénivelé calculé pour ${E.length} jour(s) sur ${A.length}.</p>`;
 }
 h+=profAll()+poiRecapHtml();
 el.innerHTML=h;
}
