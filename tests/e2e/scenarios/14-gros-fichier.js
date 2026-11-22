import {defaultTrips} from '../harness.js';
export const title='fichier de données de plus de 1 Mo (lecture par la voie « raw »)';
const raw=JSON.stringify({version:2,trips:defaultTrips()});
export const options={files:{'data.json':{content:'',encoding:'none',raw,sha:'big1'}}};
export default async function({d,ok,sleep,hash}){
 await sleep(900);
 ok(hash().startsWith('#t=B'),'le gros fichier est lu et le voyage proche s’ouvre');
 ok(d.querySelector('#title').value==='Proche','titre : '+d.querySelector('#title').value);
}
