import {mkTrip,day,b64,unb} from '../harness.js';
export const title='hébergement à l’arrivée (veille de J1) : saisie, récap hébergements, budget, annulation, fusion';
const st=(id,name)=>({id,name,notes:'',auto:false,date:'',points:[],lodging:{name:'',address:'',price:'',status:'find',nights:1}});
export const options={trips:[mkTrip('B','Proche',day(5),day(9),{stages:[st('s1','J1 stage')]})]};
export default async function({w,d,ok,sleep,ev,FS,trips,unb:_u}){
 await sleep(900);
 const L=k=>d.querySelector('.card.tr[data-dir=out] [data-lf='+k+']'),P=()=>w.eval('D.preLodging');
 ok(P().status==='na','par défaut : « Pas de nuit » (aucune obligation)');
 d.querySelector('[data-t=lodg]').click();
 ok(!/Avant le voyage/.test(d.querySelector('#p-lodg').textContent),'rien dans le récap hébergements tant qu’il n’est pas utilisé');
 d.querySelector('[data-t=stages]').click();
 d.querySelector('.card.tr[data-dir=out] .thd').click();
 d.querySelector('.card.tr[data-dir=out] details[data-k=pl]').open=true;
 ok(!!L('name')&&!!L('cancelBy')&&!!L('status')&&!!L('payer'),'bloc « Hébergement à l’arrivée » dans la carte Aller');
 ok(!d.querySelector('.card.tr[data-dir=back] [data-lf=name]'),'pas dans la carte Retour');
 const set=(k,v)=>{L(k).value=v;ev(L(k))};
 set('name','Hôtel de la Gare');set('address','1 rue du Port');set('price','90');set('nights','2');set('status','booked');set('payer','Bob');
 const soon=new Date();soon.setDate(soon.getDate()+6);set('cancelBy',soon.toISOString().slice(0,10));
 ok(P().name==='Hôtel de la Gare'&&P().price==='90'&&P().status==='booked'&&P().payer==='Bob','champs enregistrés dans le voyage');
 ok(/Réservé/.test(d.querySelector('.card.tr[data-dir=out] details[data-k=pl] summary').textContent),'pastille de statut mise à jour : '+d.querySelector('.card.tr[data-dir=out] details[data-k=pl] summary .chip').textContent);
 ok(/2 nuits|Nuits/.test(d.querySelector('.card.tr[data-dir=out] details[data-k=pl] .meta').textContent),'nuits situées avant le J1 : '+d.querySelector('.card.tr[data-dir=out] details[data-k=pl] .meta').textContent);
 // récap des hébergements
 d.querySelector('[data-t=lodg]').click();
 const lg=d.querySelector('#p-lodg').textContent.replace(/\s+/g,' ');
 ok(/Avant le voyage/.test(lg)&&/Hôtel de la Gare/.test(lg)&&/Réservé/.test(lg)&&/90 €/.test(lg),'récap hébergements : '+(lg.match(/Avant le voyage.{0,90}/)||[''])[0]);
 ok(/Réservés 1/.test(lg),'compté dans les statuts : '+(lg.match(/Réservés \d+/)||[''])[0]);
 // budget
 d.querySelector('[data-t=budget]').click();
 const bg=()=>d.querySelector('#p-budget').textContent.replace(/\s+/g,' ');
 ok(/Total · 90,00/.test(bg())&&/Veille de J1/.test(bg()),'budget : dépense « Veille de J1 » de 90 € : '+bg().slice(0,50));
 d.querySelector('#b-top [data-a=settle]').click();
 ok(/Alice doit 45,00 € à Bob/.test(bg()),'remboursement : '+(bg().match(/💸[^✓]*/)||['—'])[0].trim());
 // alerte annulation gratuite
 d.querySelector('[data-t=recap]').click();
 ok(/Hôtel de la Gare : annulation gratuite/.test(d.querySelector('#p-recap').textContent),'alerte d’annulation gratuite dans « À vérifier »');
 // limiter aux personnes concernées
 d.querySelector('[data-t=stages]').click();
 const cb=d.querySelector('.card.tr[data-dir=out] [data-lfor=Bob]');cb.checked=false;ev(cb);
 ok(JSON.stringify(P().for)==='["Alice"]','concerne seulement Alice');
 // enregistrement + fusion par différences
 d.querySelector('#bsave').click();await sleep(500);
 let saved=trips().find(t=>t.id==='B').preLodging;
 ok(saved.name==='Hôtel de la Gare'&&saved.price==='90'&&saved.nights==='2'||saved.nights===2||saved.nights==='2','enregistré dans data.json');
 const cur=JSON.parse(unb(FS['data.json'].content));cur.trips[0].preLodging.address='Adresse corrigée par un autre';FS['data.json']={content:b64(JSON.stringify(cur)),sha:'x1'};
 set('price','120');d.querySelector('#bsave').click();await sleep(500);
 saved=trips().find(t=>t.id==='B').preLodging;
 ok(saved.price==='120'&&saved.address==='Adresse corrigée par un autre','fusion par différences : mon prix (120) et l’adresse corrigée ailleurs sont tous deux conservés');
 // retour au statut « Pas de nuit » : disparaît du budget
 set('status','na');d.querySelector('[data-t=budget]').click();
 ok(!/Veille de J1/.test(bg()),'statut « Pas de nuit » : plus de dépense');
}
