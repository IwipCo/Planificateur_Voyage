export const title='parcours complet : ouverture auto, trajets, tracé, dénivélé, hébergement, récap, enregistrement';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(700);
  ok(w.location.hash.startsWith('#t=B'),'ouverture auto du voyage le plus proche à venir (hash='+w.location.hash+')');
  ok(!d.querySelector('#trip').hidden,'vue voyage affichée, titre: '+d.querySelector('#title').value);
  // trajets : pré / post étape
  ok(d.querySelectorAll('.card.tr').length===2,'2 cartes trajet (aller + retour)');
  d.querySelector('.card.tr[data-dir=out] .thd').click();
  d.querySelector('.card.tr[data-dir=out] [data-a=tadd]').click();
  d.querySelector('.card.tr[data-dir=out] [data-a=tadd]').click();
  let legs=d.querySelectorAll('.card.tr[data-dir=out] .leg');ok(legs.length===2,'2 trajets aller saisis');
  const lg=legs[0];const pr=lg.querySelector('[data-tf=price]');pr.value='60';ev(pr);
  const py=lg.querySelector('[data-tf=payer]');py.value='Bob';ev(py);
  d.querySelector('.card.tr[data-dir=out] .thd').click();
  const sum=d.querySelector('.card.tr[data-dir=out] .thd .tt').textContent;
  ok(/2 trajets/.test(sum)&&!d.querySelector('.card.tr[data-dir=out] .leg'),'replié : une seule ligne résumée -> '+sum);
  // un jour avec tracé + hébergement
  d.querySelector('#badd').click();
  const map=w.eval('map');
  d.querySelector('#bdraw').click();
  map.fire('click',{latlng:w.L.latLng(48.7,-3.4)});map.fire('click',{latlng:w.L.latLng(48.75,-3.3)});map.fire('click',{latlng:w.L.latLng(48.8,-3.2)});
  await sleep(9000);
  const s=w.eval('D.stages[0]');
  ok(s.points.length===3&&s.route&&s.route.length>1,'itinéraire automatique calculé');
  ok(s.elev&&s.elev.z.length>1,'dénivelé automatique (secours OpenTopoData) : D+ '+(s.elev&&s.elev.up));
  // hébergement + payeur
 
  const det=d.querySelector('details[data-k=l]');det.open=true;
  const L=k=>d.querySelector('[data-l='+k+']');
  L('name').value='Gîte';ev(L('name'));L('price').value='100';ev(L('price'));L('payer').value='Alice';ev(L('payer'));
  const cb=d.querySelector('[data-lfor=Bob]');cb.checked=false;ev(cb);
  ok(JSON.stringify(w.eval('D.stages[0].lodging.for'))==='["Alice"]','concerne seulement Alice');
  // récap
  d.querySelector('[data-t=recap]').click();
 const rc=d.querySelector('#p-recap').textContent.replace(/\s+/g,' ');
 ok(/Distance totale/.test(rc)&&/Dénivelé \+/.test(rc),'stats du récap');
 d.querySelector('[data-t=budget]').click();
 const bg=d.querySelector('#p-budget').textContent.replace(/\s+/g,' ');
 ok(/Total/.test(bg),'onglet Budget : '+bg.slice(0,60));
 d.querySelector('#b-top [data-a=settle]').click();
 ok(/doit/.test(d.querySelector('#p-budget').textContent),'équilibrer : '+(d.querySelector('#p-budget').textContent.match(/💸[^✓]*/)||['—'])[0].slice(0,60));
 d.querySelector('[data-t=recap]').click();
 ok(/<svg/.test(d.querySelector('#p-recap').innerHTML),'profil total affiché');
  // réorganiser
  d.querySelector('[data-t=stages]').click();
  d.querySelector('#badd').click();d.querySelector('#breorg').click();
  ok(d.querySelectorAll('.card[data-id] [data-a=up]').length===2&&!d.querySelector('.card.tr'),'mode réorganiser : flèches + corbeille, trajets masqués');
  d.querySelectorAll('.card[data-id] [data-a=down]')[0].click();
  d.querySelector('#breorg').click();
  // enregistrer
  d.querySelector('#bsave').click();await sleep(400);
  const saved=JSON.parse(unb(FS['data.json'].content));
  ok(saved.trips.length===4&&saved.trips.find(t=>t.id==='B').stages.length===2&&saved.trips.find(t=>t.id==='B').transports.length===2,'enregistré dans un seul data.json (4 voyages)');
  ok(puts.every(p=>p==='data.json'),'un seul fichier écrit : '+[...new Set(puts)].join(','));
  // dialog
  ok(!!d.querySelector('#dlg .dlg-b')&&!!d.querySelector('#dlg .dlg-f #c-ok'),'boutons des réglages dans un pied fixe');
  // retour accueil + carte avec image
  d.querySelector('#bback').click();await sleep(100);w.dispatchEvent(new w.Event('hashchange'));await sleep(300);
  ok(!d.querySelector('#home').hidden&&d.querySelectorAll('.tc[data-id]').length===4,'accueil : 4 cartes');
 

}
