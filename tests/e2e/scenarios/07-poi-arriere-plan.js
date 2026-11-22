export const title='recherche de points d’intérêt en arrière-plan';
export const options={ctx:{ovFail:3}};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  d.querySelector('#badd').click();
  const map=w.eval('map');d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
  pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
  await sleep(1800);d.querySelector('#bdraw').click();
  d.querySelector('#bpoi').click();
 
  let closed=false;w.HTMLDialogElement.prototype.close=function(){closed=true};
  d.querySelector('#pd-search').click();
  ok(!closed&&!!d.querySelector('#poistat')&&!d.querySelector('#poistat').hidden,'la fenêtre reste ouverte pour suivre l’avancement ; la recherche tourne en arrière-plan');
  ok(!d.querySelector('#poistat').hidden&&/Points \d+\/\d+/.test(d.querySelector('#poistat').textContent),'indicateur de progression : '+d.querySelector('#poistat').textContent);
  // l'appli reste utilisable pendant la recherche
  d.querySelector('[data-t=recap]').click();d.querySelector('[data-t=stages]').click();
  ok(!d.querySelector('#p-stages').hidden,'l’interface reste utilisable pendant la recherche');
  await sleep(900);
  const mid=d.querySelector('#poistat').textContent;
  await sleep(13000);
  const P=w.eval('D.pois');
  ok(d.querySelector('#poistat').hidden,'indicateur masqué à la fin (avant : '+mid+')');
  ok(P.length===9,'points ajoutés sans doublon malgré les tronçons : '+P.length+' ('+[...new Set(P.map(x=>x.type))].join(',')+')');
  ok(/point\(s\) d’intérêt ajouté/.test(d.querySelector('#toast').textContent),'message final : '+d.querySelector('#toast').textContent);
  ok(qs.length>=5,'requêtes par tronçons : '+qs.length+' (dont 3 échecs simulés puis nouvel essai)');
  ok(w.eval('dirty')===true,'voyage marqué à enregistrer');
  // arrêt
  d.querySelector('#bpoi').click();
  w.eval("D.pois=[];D.poiCov={}");
  d.querySelector('#pd-search').click();
  await sleep(300);
  d.querySelector('#bpoi').click();
  ok(/Arrêter/.test(d.querySelector('#pd-search').textContent),'le bouton devient « '+d.querySelector('#pd-search').textContent+' »');
  d.querySelector('#pd-search').click();
  await sleep(4000);
  ok(d.querySelector('#poistat').hidden,'recherche arrêtée proprement');
 

}
