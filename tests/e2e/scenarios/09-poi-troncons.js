export const title='chargement des points d’intérêt tronçon par tronçon';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  d.querySelector('#badd').click();
  const map=w.eval('map');d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
  pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
  await sleep(1800);d.querySelector('#bdraw').click();
  d.querySelector('#bpoi').click();
  const rows=()=>[...d.querySelectorAll('#pd-cov .cvr')].map(r=>r.textContent.replace(/\s+/g,' ').trim());
  ok(d.querySelectorAll('#pd-cov details').length===1,'liste des jours dans « Chargement des points d’intérêt »');
  d.querySelector('#pd-cov summary').click?.();
  const r0=rows();ok(r0.length===3&&r0.every(x=>/à charger/.test(x)),'3 tronçons, tous « à charger » : '+r0.join(' | '));
  // vue sur la carte
  d.querySelector('#pd-covmap').click();
  let n=0;w.eval('covLayer').eachLayer(()=>n++);
  ok(n===3&&/\(3 à charger\)/.test(d.querySelector('#pd-covmap').textContent),'carte : 3 tronçons colorés, bouton « '+d.querySelector('#pd-covmap').textContent+' »');
  // mise à jour d'un seul tronçon
  d.querySelector('#bpoi').click();
  d.querySelector('#pd-cov [data-cv=chunk][data-i="1"]').click();
  await sleep(2500);
  const r1=rows();
  ok(/✅/.test(r1[1])&&/à charger/.test(r1[0])&&/à charger/.test(r1[2]),'seul le tronçon 2 est chargé : '+r1.join(' | '));
  ok(/\(2 à charger\)/.test(d.querySelector('#pd-covmap').textContent),'bouton carte : '+d.querySelector('#pd-covmap').textContent);
  ok(w.eval("Object.keys(D.poiCov[D.stages[0].id].ok).join()")==='1','état mémorisé dans le voyage (ok = tronçon 1)');
  // les manquants seulement
  const before=qs.length;
  d.querySelector('#pd-search').click();
  await sleep(3500);
  const r2=rows();
  ok(r2.every(x=>/✅/.test(x)),'« Charger les manquants » : tout est chargé : '+r2.join(' | '));
  ok(qs.length-before===2,'seuls les 2 tronçons manquants ont été interrogés ('+(qs.length-before)+' requêtes)');
  ok(/\(0 à charger\)/.test(d.querySelector('#pd-covmap').textContent),'bouton carte : '+d.querySelector('#pd-covmap').textContent);
  d.querySelector('#pd-search').click();
  ok(/déjà chargés/.test(d.querySelector('#pd-msg').textContent),'rien à faire : '+d.querySelector('#pd-msg').textContent);
  // échec puis reprise
  ctx.failAll=true;
  d.querySelector('#pd-cov [data-cv=chunk][data-i="2"]').click();
  await sleep(1500);
  ok(/en cours|en attente/.test(rows()[2]),'pendant le chargement : '+rows()[2]);
  await sleep(14000);
  ok(/échec/.test(rows()[2])&&/✅/.test(rows()[0]),'tronçon en échec signalé, les autres restent chargés : '+rows().join(' | '));
  ok(w.eval('poiJob')===null,'chargement terminé malgré l’échec');
  ctx.failAll=false;
  d.querySelector('#pd-cov [data-cv=chunk][data-i="2"]').click();
  await sleep(2500);
  ok(rows().every(x=>/✅/.test(x)),'nouvel essai sur ce seul tronçon : OK');
  // mise à jour d'un jour entier
  const b2=qs.length;
  d.querySelector('#pd-cov [data-cv=day]').click();await sleep(4500);
  ok(qs.length-b2===3,'mise à jour du jour : 3 tronçons rechargés');
  d.querySelector('#bpoi').click();d.querySelector('#bdraw').click();
  pt(48.85,-3.1);
  await sleep(200);
  d.querySelector('#bpoi').click();
  ok(/modifié|à charger/.test(rows().join(' ')),'après modification du tracé : '+rows().join(' | ').slice(0,100));
 

}
