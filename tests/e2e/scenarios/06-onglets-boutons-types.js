export const title='commutateur de vue, bouton GR, onglets masquables, config voyage, types de POI';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  // --- boutons Tous les jours / Jour choisi ---
  const seg=d.querySelector('.seg');
  ok(seg&&seg.textContent.includes('Tous les jours')&&seg.textContent.includes('Jour choisi'),'commutateur : '+seg.textContent.trim());
  ok(d.querySelector('#vall').classList.contains('on')&&!d.querySelector('#vday').classList.contains('on'),'« Tous les jours » actif au départ');
  d.querySelector('#vday').click();
  ok(d.querySelector('#vday').classList.contains('on')&&!d.querySelector('#vall').classList.contains('on'),'basculer sur « Jour choisi » désactive l’autre');
  d.querySelector('#vall').click();
  // --- bouton GR ---
  const gr=d.querySelector('#bgr');ok(!!gr.querySelector('svg')&&/Sentiers GR/.test(gr.textContent),'bouton GR avec icône de balisage : '+gr.textContent.trim());
  gr.click();ok(gr.classList.contains('on')&&!!gr.querySelector('svg'),'activé : icône conservée');gr.click();
  // --- config voyage / onglets ---
  ok(!d.querySelector('.tabs [data-t=trip]'),'l’onglet « Voyage » n’est plus dans la barre d’onglets');
  const cfg=d.querySelector('#bcfg');ok(!!cfg&&/Config voyage/.test(cfg.textContent),'bouton « '+cfg.textContent.trim()+' » à côté du nom : '+d.querySelector('#title').value);
  cfg.click();ok(!d.querySelector('#p-trip').hidden&&d.querySelector('#p-stages').hidden&&cfg.classList.contains('on'),'ouvre la configuration du voyage');
  ok(d.querySelectorAll('#t-tabs input').length===5,'5 onglets désactivables : '+[...d.querySelectorAll('#t-tabs label')].map(l=>l.textContent).join(', '));
  const chk=k=>d.querySelector('#t-tabs [data-tab='+k+']');
  chk('lodg').checked=false;chk('lodg').dispatchEvent(new w.Event('change',{bubbles:true}));
  chk('budget').checked=false;chk('budget').dispatchEvent(new w.Event('change',{bubbles:true}));
  ok(d.querySelector('.tabs [data-t=lodg]').hidden&&d.querySelector('.tabs [data-t=budget]').hidden&&!d.querySelector('.tabs [data-t=check]').hidden,'Hébergement et Budget masqués, Checklist toujours là');
  ok(JSON.stringify(w.eval('D.tabsOff'))==='["lodg","budget"]','mémorisé dans le voyage : '+JSON.stringify(w.eval('D.tabsOff')));
  cfg.click();ok(!d.querySelector('#p-stages').hidden,'re-clic : retour aux jours');
  // masquer l'onglet actif -> retour aux jours
  d.querySelector('.tabs [data-t=check]').click();cfg.click();
  chk('check').checked=false;chk('check').dispatchEvent(new w.Event('change',{bubbles:true}));
  cfg.click();d.querySelector('.tabs [data-t=recap]').click();
  ok(!d.querySelector('#p-recap').hidden,'onglets restants fonctionnent');
  // --- POI détaillés ---
  d.querySelector('[data-t=stages]').click();
  d.querySelector('#badd').click();
  const map=w.eval('map');d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
  pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
  await sleep(1800);d.querySelector('#bdraw').click();
  d.querySelector('#bpoi').click();
  const lbl=[...d.querySelectorAll('#pd-cats label')].map(l=>l.textContent.trim());
  ok(lbl.length===12&&['Points d’eau','Campings','Gîtes et auberges','Chambres d’hôtes','Hôtels','Toilettes','Bars et cafés','Restaurants'].every(x=>lbl.some(l=>l.includes(x))),'12 types dont : '+lbl.slice(0,9).join(' | '));
 d.querySelector('#pd-search').click();await sleep(4500);
  const T=w.eval('D.pois').map(x=>x.type);
  ok(['water','shop','wc','hotel','bnb','gite','bar','resto','camp'].every(t=>T.includes(t)),'types reconnus : '+[...new Set(T)].join(', '));
  const cb=d.querySelector('[data-pc=hotel]');cb.checked=false;cb.dispatchEvent(new w.Event('change',{bubbles:true}));
  let n=0;w.eval('poiLayer').eachLayer(()=>n++);ok(n===w.eval('D.pois').length-1,'décocher « Hôtels » masque ces points ('+n+' visibles)');
 

}
