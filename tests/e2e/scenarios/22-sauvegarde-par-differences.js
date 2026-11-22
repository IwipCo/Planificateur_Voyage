import {b64,unb,mkTrip,day} from '../harness.js';
export const title='sauvegarde par différences : on ne pousse que nos changements, ceux des autres ne sont jamais écrasés';
const st=(id,name)=>({id,name,notes:'',auto:false,date:'',points:[],lodging:{name:'',address:'',price:'',status:'find',nights:1}});
export const options={
 trips:[mkTrip('A','Loin',day(30),day(34)),mkTrip('B','Proche',day(5),day(9),{stages:[st('s1','J1 stage'),st('s2','J2 stage')]}),mkTrip('D','Passé',day(-40),day(-36))],
 hook:async(u,o,ctx)=>{
  if(ctx.arm409&&o.method==='PUT'&&/data\.json/.test(u)){
   ctx.arm409=false;ctx.attempts=(ctx.attempts||0)+1;
   const cur=JSON.parse(unb(ctx.FS['data.json'].content));
   const B=cur.trips.find(t=>t.id==='B');B.checklist=[...(B.checklist||[]),{id:'k-409',text:'ajouté pendant l’enregistrement',who:'',done:false}];B.stages[0].lodging.price='77';
   ctx.FS['data.json']={content:b64(JSON.stringify(cur)),sha:'conflit-1'};
   return{ok:false,status:409,json:async()=>({}),text:async()=>''};
  }
 }
};
export default async function({w,d,ok,sleep,ev,FS,ctx,trips,errors}){
 await sleep(900);
 const remote=fn=>{const cur=JSON.parse(unb(FS['data.json'].content));fn(cur);FS['data.json']={content:b64(JSON.stringify(cur)),sha:'r'+Math.random()}};
 const B=()=>trips().find(t=>t.id==='B'),S=id=>B().stages.find(s=>s.id===id);
 // ---- 1. modifications locales et distantes sur des champs différents, jours différents, voyages différents ----
 d.querySelector('.card[data-id=s1] .hd').click();
 const notes=d.querySelector('.card[data-id=s1] [data-f=notes]');notes.value='mes notes';ev(notes);
 remote(c=>{
  const b=c.trips.find(t=>t.id==='B');b.stages[0].lodging.name='Gîte distant';b.stages[1].notes='note distante';b.title='Titre distant';
  b.checklist=[{id:'k-r',text:'réchaud',who:'Bob',done:false}];
  c.trips.find(t=>t.id==='A').title='Loin (renommé ailleurs)';
  c.trips=c.trips.filter(t=>t.id!=='D');c.trips.push({id:'Z',title:'Créé ailleurs',start:'',end:'',participants:['Bob'],stages:[],messages:[],transports:[]});
 });
 d.querySelector('#bsave').click();await sleep(500);
 ok(S('s1').notes==='mes notes','ma modification (notes du J1) est enregistrée');
 ok(S('s1').lodging.name==='Gîte distant','la modification d’un autre champ du même jour (hébergement) est conservée');
 ok(S('s2').notes==='note distante','la modification d’un autre jour est conservée');
 ok(B().title==='Titre distant','le titre changé ailleurs n’est pas écrasé par notre copie périmée');
 ok((B().checklist||[]).some(k=>k.id==='k-r'),'l’objet ajouté ailleurs à la checklist est conservé');
 ok(trips().find(t=>t.id==='A').title==='Loin (renommé ailleurs)','un autre voyage modifié ailleurs n’est pas écrasé');
 ok(trips().some(t=>t.id==='Z')&&!trips().some(t=>t.id==='D'),'voyage créé ailleurs conservé, voyage supprimé ailleurs respecté');
 ok(d.querySelector('#title').value==='Titre distant'&&w.eval('D.stages[1].notes')==='note distante','l’écran affiche aussitôt les changements des autres');
 // ---- 2. même champ modifié des deux côtés : notre version l'emporte ----
 const n2=d.querySelector('.card[data-id=s1] [data-f=notes]');n2.value='v2 (moi)';ev(n2);
 remote(c=>{c.trips.find(t=>t.id==='B').stages[0].notes='v2 (lui)'});
 d.querySelector('#bsave').click();await sleep(500);
 ok(S('s1').notes==='v2 (moi)','même champ modifié des deux côtés : le nôtre l’emporte');
 // ---- 3. actualisation pendant qu'on a des modifications non enregistrées ----
 const nm=d.querySelector('.card[data-id=s2] .hd');nm.click();
 const f=d.querySelector('.card[data-id=s2] [data-f=name]');f.value='J2 (mon nom)';ev(f);
 remote(c=>{const b=c.trips.find(t=>t.id==='B');b.stages[0].name='J1 (nom distant)';b.checklist.push({id:'k-r2',text:'tente',who:'',done:false})});
 await w.eval('refresh(true)');await sleep(300);
 ok(w.eval('D.stages[0].name')==='J1 (nom distant)'&&w.eval('D.stages[1].name')==='J2 (mon nom)','actualisation : les changements des autres arrivent, les miens restent');
 ok(w.eval('dirty')===true,'mes modifications restent à enregistrer');
 d.querySelector('#bsave').click();await sleep(500);
 ok(S('s2').name==='J2 (mon nom)'&&S('s1').name==='J1 (nom distant)'&&B().checklist.some(k=>k.id==='k-r2'),'l’enregistrement suivant garde tout');
 // ---- 4. quelqu'un écrit entre notre lecture et notre écriture (conflit 409) : relecture, fusion, nouvel essai ----
 const n4=d.querySelector('.card[data-id=s2] [data-f=notes]');n4.value='notes du J2 (moi)';ev(n4);
 ctx.arm409=true;
 d.querySelector('#bsave').click();await sleep(1500);
 ok(ctx.attempts===1,'un conflit simulé a eu lieu');
 ok(S('s2').notes==='notes du J2 (moi)'&&B().checklist.some(k=>k.id==='k-409')&&S('s1').lodging.price==='77','après le conflit : mon changement ET celui arrivé pendant l’écriture sont là');
 ok(w.eval('dirty')===false,'enregistrement abouti');
 // ---- 5. rien à fusionner : on pousse tel quel ----
 const n5=d.querySelector('.card[data-id=s2] [data-f=notes]');n5.value='dernier';ev(n5);
 const before=ctx.puts.length;d.querySelector('#bsave').click();await sleep(500);
 ok(ctx.puts.length===before+1&&S('s2').notes==='dernier','sans changement distant : un seul envoi');
 // ---- 6. une valeur par défaut ajoutée localement ne doit pas écraser une vraie valeur distante ----
 remote(c=>{const b=c.trips.find(t=>t.id==='B');b.tabsOff=['lodg','budget'];b.preLodging={name:'Hôtel distant',address:'',price:'',status:'booked',nights:1,cancelBy:'',payer:'',for:[]}});
 const n6=d.querySelector('.card[data-id=s2] [data-f=notes]');n6.value='encore';ev(n6);
 d.querySelector('#bsave').click();await sleep(500);
 ok(JSON.stringify(B().tabsOff)==='["lodg","budget"]'&&B().preLodging.name==='Hôtel distant'&&S('s2').notes==='encore','les valeurs par défaut locales n’écrasent pas ce qu’un autre a réglé : '+JSON.stringify(B().tabsOff));
 ok(errors.length===0,'aucune erreur JavaScript');
}
