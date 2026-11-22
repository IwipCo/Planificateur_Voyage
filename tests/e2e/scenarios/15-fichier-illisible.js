import {b64} from '../harness.js';
export const title='fichier de données illisible : message clair et aucune écriture qui écraserait';
export const options={files:{'data.json':{content:b64('{ceci n’est pas du json'),sha:'x1'}}};
export default async function({d,w,ok,sleep,puts}){
 await sleep(900);
 ok(/illisible|impossible/i.test(d.querySelector('#hmsg').textContent),'message sur l’accueil : '+d.querySelector('#hmsg').textContent.trim().slice(0,80));
 d.querySelector('#tnew').click();await sleep(300);
 ok(puts.length===0,'créer un voyage n’écrase rien');
 ok(/bloqué|n’a pas pu être lu/.test(d.querySelector('#toast').textContent)||puts.length===0,'enregistrement bloqué : '+d.querySelector('#toast').textContent);
}
