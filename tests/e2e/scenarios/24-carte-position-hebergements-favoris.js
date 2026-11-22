export const title='lecture seule hors modification, bouton Tronçons retiré, position GPS, hébergements sur la carte, favoris';
export const options={size:true};
export default async function({w,d,ok,sleep,ev,ctx}){
 await sleep(800);
 const map=w.eval('map'),S=()=>w.eval('D.stages[0]');
 const count=layer=>{let n=0;w.eval(layer).eachLayer(()=>n++);return n};
 const markers=()=>{let dr=0,mid=0;map.eachLayer(l=>{if(l.options&&l.options.draggable&&l.options.icon&&/class="wp/.test(l.options.icon.options.html||''))dr++;if(l.options&&l.options.icon&&/class="mid"/.test(l.options.icon.options.html||''))mid++});return{dr,mid}};
 d.querySelector('#badd').click();d.querySelector('#bdraw').click();
 const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
 pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
 ok(markers().dr===3&&markers().mid===2,'mode modification : 3 repères déplaçables et 2 poignées « + » '+JSON.stringify(markers()));
 await sleep(1800);
 d.querySelector('#bdraw').click();                       // fin de la modification
 d.querySelector('#vday').click();
 ok(markers().dr===0&&markers().mid===0,'« Jour choisi » hors modification : aucun repère ni poignée ('+JSON.stringify(markers())+')');
 d.querySelector('#bdraw').click();
 ok(markers().dr===3,'les repères reviennent dès que la modification est activée');
 d.querySelector('#bdraw').click();
 // ---- bouton Tronçons retiré, « voir sur la carte » conservé dans la fenêtre Points ----
 ok(!d.querySelector('#bcov'),'plus de bouton « Tronçons » au-dessus de la carte');
 d.querySelector('#bpoi').click();
 const cm=d.querySelector('#pd-covmap');ok(/Voir sur la carte/.test(cm.textContent),'fenêtre Points : « '+cm.textContent+' »');
 cm.click();ok(count('covLayer')>0&&!d.querySelector('#pdlg').hasAttribute('open'),'tronçons colorés sur la carte, fenêtre refermée');
 d.querySelector('#bpoi').click();ok(/Masquer sur la carte \(\d+ à charger\)/.test(cm.textContent),'le bouton propose de masquer : '+cm.textContent);
 cm.click();ok(count('covLayer')===0,'masqués');
 // ---- position GPS ----
 let cleared=null,cb=null;
 Object.defineProperty(w.navigator,'geolocation',{value:{watchPosition:(ok_,err)=>{cb={ok:ok_,err};return 7},clearWatch:id=>{cleared=id}},configurable:true});
 d.querySelector('#bpos').click();
 ok(!!cb&&d.querySelector('#bpos').classList.contains('on'),'suivi GPS démarré');
 cb.ok({coords:{latitude:48.60,longitude:-3.50,accuracy:30}});
 ok(count('posLayer')===2,'point bleu + cercle de précision');
 ok(Math.abs(map.getCenter().lat-48.60)<0.001&&map.getZoom()>=15,'la carte se place sur ma position');
 cb.ok({coords:{latitude:48.61,longitude:-3.51,accuracy:12}});
 ok(count('posLayer')===2,'position mise à jour sans doublon');
 map.fire('dragstart');cb.ok({coords:{latitude:48.62,longitude:-3.52,accuracy:12}});
 ok(Math.abs(map.getCenter().lat-48.62)>0.005,'après un déplacement manuel de la carte, elle ne se recentre plus');
 d.querySelector('#bpos').click();
 ok(cleared===7&&count('posLayer')===0&&!d.querySelector('#bpos').classList.contains('on'),'suivi arrêté, point retiré');
 cb=null;d.querySelector('#bpos').click();cb.err({code:1});
 ok(!d.querySelector('#bpos').classList.contains('on')&&/refusée/.test(d.querySelector('#toast').textContent),'autorisation refusée : message clair, suivi arrêté');
 // ---- hébergements sur la carte ----
 const card=()=>d.querySelector('.card[data-id]');
 const ls=card().querySelector('details[data-k=l]');ls.open=true;
 const L=k=>card().querySelector('[data-l='+k+']');
 L('name').value='Gîte du Port';ev(L('name'));L('address').value='3 quai du Port, Lannion';ev(L('address'));L('status').value='booked';ev(L('status'));L('price').value='80';ev(L('price'));
 d.querySelector('#blodg').click();
 await sleep(2500);
 ok(count('lodgLayer')===1,'adresse localisée automatiquement -> 1 hébergement sur la carte');
 ok(w.eval('D.stages[0].lodging.llSrc')==='addr'&&w.eval('D.stages[0].lodging.ll').length===2,'position enregistrée avec le voyage');
 let before=ctx.calls.search;await sleep(1500);ok(ctx.calls.search===before&&before===1,'pas de nouvelle requête tant que l’adresse ne change pas');
 const mk=[];w.eval('lodgLayer').eachLayer(l=>mk.push(l));
 const box=mk[0].getPopup()._source?mk[0].getPopup().getContent()():null;
 ok(box&&/Gîte du Port/.test(box.textContent)&&/80 €/.test(box.textContent)&&/Réservé/.test(box.textContent),'détails dans la bulle : '+(box&&box.textContent.replace(/\s+/g,' ').slice(0,70)));
 // placement à la main
 card().querySelector('[data-a=lpin]').click();
 map.fire('click',{latlng:w.L.latLng(48.5,-3.6)});
 ok(w.eval('D.stages[0].lodging.llSrc')==='manual'&&Math.abs(w.eval('D.stages[0].lodging.ll[0]')-48.5)<1e-6,'placé à la main (la position n’est plus écrasée par l’adresse)');
 L('address').value='Autre adresse';ev(L('address'));await sleep(2200);
 ok(Math.abs(w.eval('D.stages[0].lodging.ll[0]')-48.5)<1e-6,'modifier l’adresse ne déplace pas un point placé à la main');
 card().querySelector('[data-a=lclr]').click();
 ok(!w.eval('D.stages[0].lodging.ll')&&count('lodgLayer')===0,'retiré de la carte');
 d.querySelector('#blodg').click();ok(count('lodgLayer')===0,'affichage désactivable');
 // ---- favoris ----
 w.eval("D.pois=[{id:'a',type:'water',name:'Fontaine',lat:48.71,lng:-3.39},{id:'b',type:'resto',name:'Crêperie',lat:48.72,lng:-3.38,fav:true},{id:'c',type:'shop',name:'Boulangerie',lat:48.73,lng:-3.37}]");
 w.eval('drawPois()');ok(count('poiLayer')===3,'3 points affichés');
 const pm=[];w.eval('poiLayer').eachLayer(l=>pm.push(l));
 ok(pm.filter(m=>/class="poi fav"/.test(m.options.icon.options.html)).length===1,'le favori porte une étoile');
 const pop=pm[0].getPopup().getContent();const bf=[...pop.querySelectorAll('button')].find(b=>/favori/.test(b.textContent));
 bf.click();ok(w.eval('D.pois[0].fav')===true,'« ☆ Mettre en favori » enregistre le favori');
 d.querySelector('#bpoi').click();
 ok(/\(2\)/.test(d.querySelector('#pd-favn').textContent),'compteur de favoris : '+d.querySelector('#pd-favn').textContent);
 const fo=d.querySelector('#pd-fav');fo.checked=true;ev(fo,'change');
 ok(count('poiLayer')===2,'« Uniquement mes favoris » : 2 points affichés');
 const c1=d.querySelector('[data-pc=water]');c1.checked=false;ev(c1,'change');
 ok(count('poiLayer')===2,'le filtre par type est ignoré en mode favoris');
 fo.checked=false;ev(fo,'change');ok(count('poiLayer')===2,'retour à l’affichage normal (le type « Eau » est masqué : 2 points)');
 // favori depuis la fenêtre d'édition
 w.eval("openPoiDlg('c')");d.querySelector('#po-fav').checked=true;d.querySelector('#po-ok').click();
 ok(w.eval("D.pois.find(p=>p.id==='c').fav")===true,'favori via la fenêtre de modification');
}
