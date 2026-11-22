export const title='démarrage simple (test rapide)';
export default async function({w,d,ok,sleep,hash,errors}){
 await sleep(800);
 ok(typeof w.__tp==='object','les modules se chargent et s’exposent pour les tests');
 ok(hash().startsWith('#t=B'),'le voyage le plus proche est ouvert au démarrage ('+hash()+')');
 ok(!d.querySelector('#trip').hidden&&d.querySelector('#home').hidden,'vue voyage affichée, accueil masqué');
 ok(d.querySelector('#title').value==='Proche','titre du voyage : '+d.querySelector('#title').value);
 ok(d.querySelectorAll('.tabs button').length===7||d.querySelectorAll('.tabs button').length===6,'barre d’onglets : '+[...d.querySelectorAll('.tabs button')].map(b=>b.textContent).join(' / '));
 ok(!!w.__tp.map&&typeof w.__tp.map.getZoom()==='number','carte Leaflet créée');
 ok(errors.length===0,'aucune erreur JavaScript au démarrage');
}
