import {b64} from '../harness.js';
const cfg={owner:'moi',repo:'carnet',branch:'main',path:'data.json',token:'ghp_test',me:'Chloé'};
const enc=btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export const title='import de la configuration par lien (#cfg=…)';
export const options={cfg:null,url:'https://u.github.io/voyage/#cfg='+enc};
export default async function({d,w,ok,sleep}){
 await sleep(900);
 const saved=JSON.parse(w.localStorage.getItem('tp_cfg')||'{}');
 ok(saved.token==='ghp_test'&&saved.me==='Chloé'&&saved.owner==='moi','configuration enregistrée dans le navigateur');
 ok(!/cfg=/.test(w.location.hash)&&!/cfg=/.test(w.location.href),'le token est retiré de l’adresse : '+w.location.href);
 ok(/Configuration importée/.test(d.querySelector('#toast').textContent)||w.__imp===1,'message de confirmation');
 ok(w.eval('C.token')==='ghp_test','la configuration est active sans recharger');
}
