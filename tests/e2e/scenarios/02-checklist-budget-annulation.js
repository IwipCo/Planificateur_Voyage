export const title='checklist, budget, annulation gratuite, barre d’itinéraire';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  const tabs=[...d.querySelectorAll('.tabs button')].map(b=>b.textContent);
  ok(tabs.length===6,'onglets : '+tabs.join(' / '));
  ok(/position:sticky/.test(d.querySelector('style').textContent),'barre d’onglets collante (toujours visible)');
  // barre carte
  ok(d.querySelector('#editbar').hidden,'boutons d’édition cachés au départ');
  d.querySelector('#bdraw').click();
  ok(!d.querySelector('#editbar').hidden&&/Terminer/.test(d.querySelector('#bdraw').textContent),'« Modifier l’itinéraire » affiche : '+[...d.querySelectorAll('#editbar button')].map(b=>b.textContent).join(' | '));
  d.querySelector('#bdraw').click();ok(d.querySelector('#editbar').hidden,'et les masque à nouveau');
  // hébergement : annulation
  d.querySelector('#badd').click();
  const L=k=>d.querySelector('[data-l='+k+']');d.querySelector('details[data-k=l]').open=true;
  ok(!!L('cancelBy'),'champ annulation gratuite présent');
  const soon=new Date();soon.setDate(soon.getDate()+6);const sd=soon.toISOString().slice(0,10);
  L('name').value='Hôtel';ev(L('name'));L('cancelBy').value=sd;ev(L('cancelBy'));L('status').value='booked';ev(L('status'));L('price').value='80';ev(L('price'));L('payer').value='Bob';ev(L('payer'));
  d.querySelector('[data-t=recap]').click();
  ok(/annulation gratuite/.test(d.querySelector('#p-recap').textContent),'alerte annulation dans « À vérifier »');
  // checklist
  d.querySelector('[data-t=check]').click();
  d.querySelector('#ck-new').value='Tente';d.querySelector('#ck-who').value='Bob';d.querySelector('#ck-add').click();
  d.querySelector('#ck-new').value='Pharmacie';d.querySelector('#ck-who').value='*';d.querySelector('#ck-add').click();
  ok(d.querySelectorAll('.ck').length===2,'2 objets ajoutés ('+[...d.querySelectorAll('#p-check .sec span:first-child')].map(x=>x.textContent).join(', ')+')');
  const cb=d.querySelector('.ck [data-ck=done]');cb.checked=true;ev(cb);
  ok(/1\/2/.test(d.querySelector('#ck-count').textContent),'compteur : '+d.querySelector('#ck-count').textContent);
  // budget
  d.querySelector('[data-t=budget]').click();
  d.querySelector('#p-budget [data-a=sadd]').click();
  const sf=k=>d.querySelector('#p-budget [data-sf='+k+']');
  sf('label').value='Courses';ev(sf('label'));sf('amt').value='30';ev(sf('amt'));sf('payer').value='Alice';ev(sf('payer'));
  const top=d.querySelector('#b-top').textContent.replace(/\s+/g,' ');
  ok(/Total · 110,00/.test(top),'total des dépenses : '+top.slice(0,90));
  d.querySelector('#b-top [data-a=settle]').click();
  const t1=d.querySelector('#p-budget').textContent.replace(/\s+/g,' ');
  ok(/doit/.test(t1),'équilibrer : '+(t1.match(/💸[^✓]*/)||['—'])[0]);
  d.querySelector('#b-top [data-a=paid]').click();
  const t2=d.querySelector('#p-budget').textContent.replace(/\s+/g,' ');
  ok(/équilibrés/.test(t2)&&/Remboursements effectués \(1\)/.test(t2),'après « Remboursé » : comptes équilibrés');
  // enregistrement
  d.querySelector('#bsave').click();await sleep(400);
  const sv=JSON.parse(unb(FS['data.json'].content)).trips.find(t=>t.id==='B');
  ok(sv.checklist.length===2&&sv.spend.length===1&&sv.payments.length===1&&sv.stages[0].lodging.cancelBy===sd,'tout est enregistré dans data.json');
  // accueil + crayon
  d.querySelector('#bback').click();await sleep(100);w.dispatchEvent(new w.Event('hashchange'));await sleep(300);
  ok(d.querySelectorAll('[data-edit]').length===4,'crayon sur chaque carte');
  d.querySelector('[data-edit=A]').click();
  ok(d.querySelector('#tdlg').hasAttribute('open')&&d.querySelector('#td-name').value==='Loin','le crayon ouvre la popup de modification du voyage');
 

}
