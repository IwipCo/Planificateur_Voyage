export const title='itinéraire : piéton / voiture, tronçons forcés, drapeaux';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  d.querySelector('#badd').click();
  const map=w.eval('map');
  d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
  pt(48.70,-3.40);pt(48.72,-3.35);
  d.querySelector('#bdirect').click();pt(48.74,-3.30);d.querySelector('#bdirect').click();pt(48.76,-3.25);
  const s=()=>w.eval('D.stages[0]');
  ok(JSON.stringify(s().points.map(p=>p.length))==='[2,2,3,2]','le 3e repère est marqué « ligne droite » : '+JSON.stringify(s().points.map(p=>p[2]||0)));
  await sleep(1500);
  ok(urls.length===2&&urls.every(u=>u.startsWith('routed-foot')),'piéton : 2 appels de routage, tronçon forcé non routé -> '+urls.join(' ; '));
  ok(s().route&&s().routeKm>0,'itinéraire enregistré : '+s().routeKm.toFixed(1)+' km');
  ok(d.querySelectorAll('.wp.fl').length===1,'repère forcé affiché en carré');
  // mode voiture
  urls.length=0;
  const rm=d.querySelector('#rmode');rm.value='car';rm.dispatchEvent(new w.Event('change'));
  await sleep(1500);
  ok(urls.length===2&&urls.every(u=>u.startsWith('routed-car')),'voiture : appels sur routed-car -> '+urls.join(' ; ')+' | mode='+s().rmode);
  ok(/en voiture/.test(d.querySelector('.card[data-id] .bd .meta').textContent),'fiche : '+d.querySelector('.card[data-id] .bd .meta').textContent);
  // déplacement : le drapeau est conservé
  const mk=[];map.eachLayer(l=>{if(l.options&&l.options.draggable&&l.getLatLng)mk.push(l)});
  const m3=mk.find(m=>/fl/.test(m.options.icon.options.html));
  m3.setLatLng([48.745,-3.29]);m3.fire('dragend');
  ok(s().points[2][2]===1&&s().points[2][0]===48.745,'déplacer un repère forcé conserve le drapeau');
  // bascule via le popup
  const mk2=[];map.eachLayer(l=>{if(l.options&&l.options.draggable&&l.getLatLng&&l.getPopup)mk2.push(l)});
  const m3b=mk2.find(m=>/fl/.test(m.options.icon.options.html));
  const btn=m3b.getPopup().getContent().querySelector('button');btn.click();
  ok(s().points[2].length===2,'popup : retour au tracé suivant les chemins');
 

}
