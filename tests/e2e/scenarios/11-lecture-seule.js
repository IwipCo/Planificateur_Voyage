import {defaultTrips} from '../harness.js';
export const title='mode lecture seule (sans token) : lecture via GitHub Pages, aucune écriture';
export const options={cfg:null,hook:async(u,o,ctx)=>{
 if(/^https:\/\/u\.github\.io\/voyage\/data\.json/.test(u)||u.startsWith('data.json'))return{ok:true,status:200,json:async()=>({version:2,trips:defaultTrips()})};
}};
export default async function({d,w,ok,sleep,puts,hash}){
 await sleep(900);
 ok(hash().startsWith('#t=B'),'le voyage le plus proche s’ouvre aussi en lecture seule');
 ok(/Lecture seule/.test(d.querySelector('#st').textContent),'statut : '+d.querySelector('#st').textContent);
 d.querySelector('#bsave').click();
 ok(d.querySelector('#dlg').hasAttribute('open'),'« Enregistrer » ouvre les réglages pour saisir le token');
 d.querySelector('#bback').click();await sleep(100);w.dispatchEvent(new w.Event('hashchange'));await sleep(300);
 ok(puts.length===0,'aucune écriture réseau');
 ok(d.querySelectorAll('.tc[data-id]').length===4&&/Lecture seule/.test(d.querySelector('#hmsg').textContent),'accueil : 4 voyages + bandeau « lecture seule »');
 d.querySelector('#tnew').click();
 ok(d.querySelector('#dlg').hasAttribute('open'),'créer un voyage demande d’abord le token');
}
