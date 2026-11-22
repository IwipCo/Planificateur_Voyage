import {b64,unb} from '../harness.js';
export const title='deux personnes enregistrent en même temps : rien ne se perd';
export default async function({d,w,ok,sleep,FS,puts,trips,errors}){
 await sleep(800);
 // pendant que l'appli est ouverte, quelqu'un d'autre modifie le fichier distant
 const cur=JSON.parse(unb(FS['data.json'].content));
 cur.trips.find(t=>t.id==='A').title='Titre changé par un autre';
 cur.trips.find(t=>t.id==='B').messages.push({id:'m-distant',author:'Bob',text:'salut',ts:1});
 cur.trips.push({id:'Z',title:'Créé ailleurs',start:'',end:'',participants:['Bob'],stages:[],messages:[],transports:[]});
 FS['data.json']={content:b64(JSON.stringify(cur)),sha:'distant-1'};
 // de son côté, on ajoute un jour et on enregistre
 d.querySelector('#badd').click();
 d.querySelector('#bsave').click();await sleep(500);
 const s=trips(),A=s.find(t=>t.id==='A'),B=s.find(t=>t.id==='B');
 ok(A.title==='Titre changé par un autre','un voyage non modifié ici reprend la version distante');
 ok(B.stages.length===1,'notre modification est conservée');
 ok(B.messages.some(m=>m.id==='m-distant'),'le message distant est fusionné dans le voyage ouvert');
 ok(s.some(t=>t.id==='Z'),'le voyage créé ailleurs n’est pas perdu');
 ok(w.eval('D.messages.length')===1&&w.eval('D.stages.length')===1,'l’écran reste cohérent après la fusion');
 ok(puts.filter(p=>p==='data.json').length===1,'une seule écriture, sans conflit (409)');
 // 2e conflit : suppression distante d'un voyage que nous n'avons pas touché
 const c2=JSON.parse(unb(FS['data.json'].content));c2.trips=c2.trips.filter(t=>t.id!=='D');
 FS['data.json']={content:b64(JSON.stringify(c2)),sha:'distant-2'};
 d.querySelector('#badd').click();d.querySelector('#bsave').click();await sleep(500);
 ok(!trips().some(t=>t.id==='D'),'une suppression faite ailleurs est respectée');
 ok(errors.length===0,'aucune erreur JavaScript');
}
