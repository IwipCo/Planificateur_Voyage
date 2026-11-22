import {mkTrip,day} from '../harness.js';
export const title='aucun voyage à venir : on reste sur l’accueil';
export const options={trips:[mkTrip('P','Passé',day(-40),day(-36)),mkTrip('N','Sans date','','')]};
export default async function({ok,sleep,hash,d}){
 await sleep(800);
 ok(hash()==='','pas de voyage ouvert d’office');
 ok(!d.querySelector('#home').hidden,'accueil affiché');
 const st=[...d.querySelectorAll('.tc .chip')].map(c=>c.textContent.trim());
 ok(st.some(x=>/Terminé/.test(x))&&st.some(x=>/Dates à définir/.test(x)),'statuts : '+st.join(' | '));
}
