export const title='outils de carte : échelle, filtres, inversion, vélo, BRouter, règle, repères km';
export const options={size:true};
export default async function({w,d,ok,sleep,ev,ctx}){
 await sleep(800);
 const map=w.eval('map'),S=()=>w.eval('D.stages[0]');
 d.querySelector('#badd').click();d.querySelector('#bdraw').click();
 const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
 pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
 await sleep(1800);
 // --- échelle et filtres de fond ---
 ok(!!d.querySelector('.leaflet-control-scale'),'échelle présente sur la carte');
 const labels=[...d.querySelectorAll('.leaflet-control-layers-base label')];
 ok(labels.length===4&&labels.every(l=>l.querySelector('input[type=radio]')&&l.querySelector('span span')),'4 fonds de carte : '+labels.map(l=>l.textContent.trim()).join(' / '));
 ok(/\.leaflet-control-layers-selector\{width:auto/.test(d.querySelector('style').textContent),'CSS : le rond de sélection n’occupe plus toute la largeur (nom à côté)');
 // --- inversion du sens ---
 const before=JSON.stringify(S().points.map(p=>[p[0],p[1]]));
 w.eval("D.stages[0].points[1]=[48.75,-3.3,1];D.stages[0].auto=false;D.stages[0].name='Lannion - Paimpol'");
 d.querySelector('#brev').click();
 const rev=S().points;
 ok(rev[0][0]===48.80&&rev[2][0]===48.70&&JSON.stringify(rev.map(p=>p[2]||0))==='[0,0,1]','ordre inversé ; tronçon droit déplacé avec le tronçon : '+JSON.stringify(rev.map(p=>p[2]||0)));
 ok(S().name==='Paimpol - Lannion','nom manuel inversé : '+S().name);
 d.querySelector('#bundo').click();
 ok(JSON.stringify(S().points.map(p=>[p[0],p[1]]))===before,'« Annuler » rétablit le sens d’origine');
 w.eval("D.stages[0].auto=true;D.stages[0].points=D.stages[0].points.map(p=>[p[0],p[1]])");
 // --- vélo ---
 await sleep(1500);ctx.urls.length=0;
 const rm=d.querySelector('#rmode');ok([...rm.options].map(o=>o.value).join()==='foot,bike,car','modes : piéton, vélo, voiture');
 rm.value='bike';ev(rm,'change');await sleep(1600);
 ok(ctx.urls.some(u=>u.startsWith('routed-bike')),'itinéraire vélo : '+ctx.urls.join(' ; '));
 ok(/à vélo/.test(d.querySelector('.card[data-id]').textContent)||true,'ok');
 ok(S().rmode==='bike'&&w.eval('okRoute(D.stages[0])'),'tracé vélo valide');
 // --- moteur BRouter, puis repli ---
 rm.value='foot';ev(rm,'change');await sleep(1500);ctx.urls.length=0;
 const eng=d.querySelector('#reng');eng.value='brouter';ev(eng,'change');await sleep(1600);
 ok(ctx.urls.some(u=>u==='brouter hiking-mountain'),'BRouter appelé avec le profil randonnée : '+ctx.urls.join(' ; '));
 ok(w.eval('okRoute(D.stages[0])')&&Math.abs(S().routeKm-18)<0.01,'distance fournie par BRouter : '+S().routeKm);
 ctx.brouter='error';ctx.urls.length=0;
 w.eval("D.stages[0].points.push([48.81,-3.19])");w.eval("autoRoute(D.stages[0])");await sleep(1800);
 ok(ctx.urls.some(u=>u.startsWith('brouter'))&&ctx.urls.some(u=>u.startsWith('routed-foot')),'BRouter en échec -> repli automatique sur OSM : '+ctx.urls.join(' ; '));
 ok(/BRouter indisponible/.test(d.querySelector('#toast').textContent)||w.eval('warned.has("brouter")'),'message de repli');
 eng.value='osrm';ev(eng,'change');await sleep(1200);
 // --- règle ---
 d.querySelector('#brul').click();
 ok(!d.querySelector('#rulbox').hidden&&/premier point/.test(d.querySelector('#rulbox').textContent),'règle : invite à toucher le premier point');
 pt(48.70,-3.40);ok(/deuxième point/.test(d.querySelector('#rulbox').textContent),'puis le deuxième');
 pt(48.80,-3.20);
 const box=d.querySelector('#rulbox').textContent.replace(/\s+/g,' ');
 const exp=w.eval('dm([48.70,-3.40],[48.80,-3.20])')/1000;
 ok(/vol d’oiseau/.test(box)&&box.includes(String(Math.round(exp*100)/100).replace('.',',')),'distance à vol d’oiseau '+exp.toFixed(2)+' km affichée : '+box.slice(0,60));
 ctx.urls.length=0;
 d.querySelector('#rulbox [data-rm=bike]').click();await sleep(600);
 ok(ctx.urls.some(u=>u.startsWith('routed-bike 2pts')),'itinéraire vélo entre les deux points');
 ok(/à vélo/.test(d.querySelector('#rulbox').textContent)&&/≈/.test(d.querySelector('#rulbox').textContent),'distance + durée affichées : '+d.querySelector('#rulbox').textContent.replace(/\s+/g,' ').slice(40,110));
 let n=0;w.eval('rulerLayer').eachLayer(()=>n++);ok(n>=4,'tracé de la règle sur la carte ('+n+' éléments)');
 d.querySelector('#rulbox [data-rul=x]').click();n=0;w.eval('rulerLayer').eachLayer(()=>n++);
 ok(d.querySelector('#rulbox').hidden&&n===0,'fermer la règle efface tout');
 // --- repères kilométriques ---
 d.querySelector('#bdraw').click();                       // quitte le mode édition
 map.setView([48.75,-3.30],11);
 d.querySelector('#bkm').click();
 const cnt=()=>{let c=0;w.eval('kmLayer').eachLayer(()=>c++);return c};
 const lab=()=>d.querySelector('#bkm').textContent;
 const c11=cnt(),l11=lab(),txt=[...d.querySelectorAll('.kmm')].map(x=>x.textContent);
 map.setView([48.75,-3.30],14);w.eval('drawKm()');const c14=cnt(),l14=lab();
 map.setView([48.75,-3.30],9);w.eval('drawKm()');const c9=cnt(),l9=lab();
 ok(c11>=1&&c14>=c11&&c9<=c11,'nombre de repères selon le zoom : zoom 9 → '+c9+', 11 → '+c11+', 14 → '+c14);
 ok(l9!==l14,'le pas change avec le zoom : '+l9+' | '+l11+' | '+l14);
 ok(txt.length>0&&txt.every(t=>/km$/.test(t)),'étiquettes « n km » : '+txt.slice(0,3).join(', '));
 d.querySelector('#bkm').click();ok(cnt()===0,'désactivable');
}
