export const title='annuler pas à pas, popup de modification et suppression du voyage';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  // ---- annuler = revenir en arrière ----
  d.querySelector('#badd').click();
  const map=w.eval('map'),st=()=>w.eval('D.stages[0]'),pts=()=>JSON.stringify(st().points);
  d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)}),undo=()=>d.querySelector('#bundo').click();
  pt(48.70,-3.40);pt(48.72,-3.35);pt(48.74,-3.30);
  ok(st().points.length===3,'3 points posés');
  undo();ok(st().points.length===2,'annuler -> retire le dernier point posé');
  pt(48.80,-3.20);
  const before=pts();
  // insertion
  const mids=[];map.eachLayer(l=>{if(l.options&&l.options.icon&&/class="mid"/.test(l.options.icon.options.html||''))mids.push(l)});
  mids[0].fire('click');ok(st().points.length===4,'point inséré entre deux repères');
  undo();ok(pts()===before,'annuler -> annule l’insertion');
  // déplacement
  let mk=[];map.eachLayer(l=>{if(l.options&&l.options.draggable&&l.getPopup&&l.getPopup()&&/wp/.test(l.options.icon.options.html))mk.push(l)});
  mk[0].setLatLng([49,-3]);mk[0].fire('dragend');ok(st().points[0][0]===49,'repère déplacé');
  undo();ok(pts()===before,'annuler -> annule le déplacement');
  // suppression
  mk=[];map.eachLayer(l=>{if(l.options&&l.options.draggable&&l.getPopup&&l.getPopup()&&/wp/.test(l.options.icon.options.html))mk.push(l)});
  mk[1].getPopup().getContent().querySelector('.danger').click();ok(st().points.length===2,'repère supprimé');
  undo();ok(pts()===before,'annuler -> restaure le repère supprimé');
  undo();undo();undo();undo();
  ok(st().points.length===0,'plusieurs annulations successives -> retour à zéro');
  undo();
  // ---- accueil : crayon -> popup ----
  d.querySelector('#bdraw').click();
  d.querySelector('#bback').click();await sleep(100);w.dispatchEvent(new w.Event('hashchange'));await sleep(300);
  ok(d.querySelectorAll('[data-del]').length===0,'plus de poubelle sur les cartes');
  ok(d.querySelectorAll('[data-edit]').length===4,'crayon sur chaque carte');
  d.querySelector('[data-edit=A]').click();
  ok(d.querySelector('#td-name').value==='Loin'&&d.querySelector('#td-parts').value==='Alice, Bob','popup : infos du voyage ('+d.querySelector('#td-info').textContent+')');
  d.querySelector('#td-name').value='Loin (renommé)';d.querySelector('#td-parts').value='Alice, Bob, Chloé';
  d.querySelector('#td-ok').click();await sleep(500);
  const sv=JSON.parse(unb(FS['data.json'].content)).trips.find(t=>t.id==='A');
  ok(sv.title==='Loin (renommé)'&&sv.participants.length===3,'modification enregistrée dans data.json');
  ok([...d.querySelectorAll('.tc b')].some(b=>b.textContent==='Loin (renommé)'),'carte mise à jour');
  // suppression depuis le popup
  d.querySelector('[data-edit=C]').click();d.querySelector('#td-del').click();await sleep(500);
  const sv2=JSON.parse(unb(FS['data.json'].content));
  ok(sv2.trips.length===3&&!sv2.trips.find(t=>t.id==='C'),'suppression depuis le popup : '+sv2.trips.map(t=>t.id).join(','));
 

}
