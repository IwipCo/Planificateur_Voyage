import {b64,unb} from '../harness.js';
export const title='migration depuis l’ancien format (voyage unique + dossier data/) vers un seul data.json';
const trip=(t,extra={})=>JSON.stringify({title:t,start:'',end:'',participants:['Moi'],stages:[{id:'a',name:'J1',points:[[48,-3],[48.1,-3.1]]}],messages:[],...extra});
export const options={files:{
 'data.json':{content:b64(trip('Ancien GR34')),sha:'s0'},
 'data/index.json':{content:b64(JSON.stringify({trips:[{id:'legacy',file:'data.json',name:'x'},{id:'v1',name:'Ouessant'},{id:'v2',name:'Corse'}]})),sha:'i0'},
 'data/v1.json':{content:b64(trip('Ouessant')),sha:'a1'},
 'data/v2.json':{content:b64(trip('Corse')),sha:'a2'}
}};
export default async function({d,ok,sleep,FS,puts,w}){
 await sleep(900);
 const saved=JSON.parse(unb(FS['data.json'].content));
 ok(Array.isArray(saved.trips)&&saved.trips.length===3,'trois voyages regroupés : '+saved.trips.map(t=>t.title).join(' | '));
 ok(saved.migrated===true,'drapeau « migré » enregistré (la migration ne se rejoue pas)');
 ok(puts.length===1&&puts[0]==='data.json','une seule écriture, dans data.json : '+puts.join(','));
 ok(!!FS['data/v1.json']&&!!FS['data/index.json'],'les anciens fichiers ne sont pas supprimés');
 ok([...d.querySelectorAll('.tc b')].map(x=>x.textContent).join('|').includes('Ancien GR34'),'cartes sur l’accueil : '+[...d.querySelectorAll('.tc b')].map(x=>x.textContent).join(' | '));
 ok(saved.trips.every(t=>Array.isArray(t.stages)&&Array.isArray(t.transports)&&Array.isArray(t.checklist)&&Array.isArray(t.pois)),'chaque voyage est complété avec les nouveaux champs');
 ok(d.querySelector('#home').hidden===false,'accueil affiché (aucun voyage daté)');
}
