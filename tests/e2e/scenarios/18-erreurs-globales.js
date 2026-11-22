export const title='filet de sécurité : une erreur inattendue s’affiche au lieu d’échouer en silence';
export const allowErrors=true;
export default async function({d,w,ok,sleep}){
 await sleep(700);
 w.dispatchEvent(new w.ErrorEvent('error',{message:'boom de test'}));
 ok(/Erreur inattendue/.test(d.querySelector('#toast').textContent)&&/boom de test/.test(d.querySelector('#toast').textContent),'message affiché : '+d.querySelector('#toast').textContent);
}
