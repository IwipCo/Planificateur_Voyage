export const title='profil d’altitude : 3 fournisseurs, bouton Update profil';
export const options={ctx:{elev:{om:"error",ot:"http500",oe:"ok"}}};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  const css=d.querySelector('style').textContent;
  ok(/#panel\{[^}]*padding:0 12px 10px/.test(css)&&!/margin:-10px/.test(css),'panneau sans marge haute, onglets collés en haut sans écart');
  d.querySelector('#badd').click();
  const map=w.eval('map');d.querySelector('#bdraw').click();
  const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
  pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
  await sleep(9000);
  const s=()=>w.eval('D.stages[0]');
  ok(s().elev&&s().elev.z.length>1,'profil calculé automatiquement via le 3e fournisseur : D+ '+(s().elev&&s().elev.up));
  // on casse le profil puis on utilise le bouton
  w.eval('delete D.stages[0].elev;delete D.stages[0].elevKey');
  ok(!!d.querySelector('#belev')&&!d.querySelector('#editbar').hidden,'bouton « '+d.querySelector('#belev').textContent+' » présent dans le menu d’itinéraire');
  d.querySelector('#belev').click();
  await sleep(3500);
  ok(s().elev&&s().elev.z.length>1,'bouton : profil recalculé (D+ '+(s().elev&&s().elev.up)+')');
  ok(/Profil mis à jour/.test(d.querySelector('#toast').textContent),'message : '+d.querySelector('#toast').textContent);
 

}
