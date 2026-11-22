import {mkTrip,day} from '../harness.js';
export const title='ouverture automatique : voyage en cours prioritaire';
export const options={trips:[mkTrip('P','Passé',day(-40),day(-36)),mkTrip('U','Bientôt',day(3),day(6)),mkTrip('E','En cours',day(-1),day(2)),mkTrip('N','Sans date','','')]};
export default async function({ok,sleep,hash,d}){
 await sleep(800);
 ok(hash().startsWith('#t=E'),'le voyage en cours passe avant le prochain : '+hash());
 ok(d.querySelector('#title').value==='En cours','titre : '+d.querySelector('#title').value);
}
