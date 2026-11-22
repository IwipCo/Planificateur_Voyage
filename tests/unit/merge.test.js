import test from 'node:test';import assert from 'node:assert/strict';
import {mergeVal,clone,eq} from '../../js/lib/merge.js';
const stage=(id,extra={})=>({id,name:id,notes:'',lodging:{name:'',price:'',status:'find'},points:[[1,1],[2,2]],chat:[],...extra});
const trip=(id,extra={})=>({id,title:id,start:'',end:'',participants:['A','B'],stages:[stage('s1'),stage('s2')],messages:[],transports:[],checklist:[],pois:[],...extra});
const root=(...t)=>({version:2,trips:t});
/* b = base, l = nous, r = distant ; renvoie le résultat de la fusion (l est modifié sur place) */
const M=(b,l,r)=>mergeVal(clone(b),l,clone(r),'root');
test('rien n’a changé ici : on prend la version distante telle quelle',()=>{const b=root(trip('T')),r=root(trip('T',{title:'Autre'}));assert.deepEqual(M(b,clone(b),r),r)});
test('rien n’a changé ailleurs : on garde la nôtre',()=>{const b=root(trip('T')),l=root(trip('T',{title:'Moi'}));assert.deepEqual(M(b,clone(l),b),l)});
test('champs différents d’un même objet : les deux modifications sont conservées',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].title='Mon titre';r.trips[0].start='2026-05-01';
 const m=M(b,l,r).trips[0];assert.equal(m.title,'Mon titre');assert.equal(m.start,'2026-05-01');
});
test('même champ modifié des deux côtés : notre version l’emporte',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].title='Moi';r.trips[0].title='Lui';assert.equal(M(b,l,r).trips[0].title,'Moi');
});
test('deux jours différents modifiés : chacun garde sa modification',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].notes='mes notes';r.trips[0].stages[1].notes='ses notes';
 const st=M(b,l,r).trips[0].stages;assert.equal(st[0].notes,'mes notes');assert.equal(st[1].notes,'ses notes');
});
test('un même jour, champs différents (notes ici, hébergement là-bas) : tout est conservé, même dans un sous-objet',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].notes='N';r.trips[0].stages[0].lodging.name='Gîte';r.trips[0].stages[0].lodging.price='80';
 const s=M(b,l,r).trips[0].stages[0];assert.equal(s.notes,'N');assert.equal(s.lodging.name,'Gîte');assert.equal(s.lodging.price,'80');
});
test('tracé (bloc atomique) modifié ici, nom modifié ailleurs : les deux sont conservés',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].points=[[9,9],[8,8],[7,7]];r.trips[0].stages[0].name='Renommé';
 const s=M(b,l,r).trips[0].stages[0];assert.deepEqual(s.points,[[9,9],[8,8],[7,7]]);assert.equal(s.name,'Renommé');
});
test('tracé modifié des deux côtés : le nôtre l’emporte',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].points=[[9,9]];r.trips[0].stages[0].points=[[5,5]];assert.deepEqual(M(b,l,r).trips[0].stages[0].points,[[9,9]]);
});
test('jour ajouté ici et jour ajouté ailleurs : les deux existent, notre ordre d’abord',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages.push(stage('mien'));r.trips[0].stages.push(stage('sien'));
 assert.deepEqual(M(b,l,r).trips[0].stages.map(s=>s.id),['s1','s2','mien','sien']);
});
test('voyage créé ailleurs pendant que nous modifions un autre : aucun des deux n’est perdu',()=>{
 const b=root(trip('A'),trip('B')),l=clone(b),r=clone(b);l.trips[1].title='Modifié ici';r.trips.push(trip('Z'));
 const m=M(b,l,r);assert.deepEqual(m.trips.map(t=>t.id),['A','B','Z']);assert.equal(m.trips[1].title,'Modifié ici');
});
test('jour supprimé ici : il reste supprimé, et les modifications distantes des autres jours sont gardées',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages.splice(0,1);r.trips[0].stages[1].notes='ailleurs';
 const st=M(b,l,r).trips[0].stages;assert.deepEqual(st.map(s=>s.id),['s2']);assert.equal(st[0].notes,'ailleurs');
});
test('jour supprimé ailleurs : supprimé aussi ici s’il n’a pas été touché, conservé s’il l’a été',()=>{
 let b=root(trip('T')),l=clone(b),r=clone(b);r.trips[0].stages.splice(0,1);
 assert.deepEqual(M(b,l,r).trips[0].stages.map(s=>s.id),['s2']);
 b=root(trip('T'));l=clone(b);r=clone(b);r.trips[0].stages.splice(0,1);l.trips[0].stages[0].notes='mon travail';
 assert.deepEqual(M(b,l,r).trips[0].stages.map(s=>s.id).sort(),['s1','s2']);   // le jour modifié ici est conservé
});
test('réordonnancement distant adopté si nous n’avons rien ajouté ni déplacé',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].notes='x';r.trips[0].stages.reverse();
 const st=M(b,l,r).trips[0].stages;assert.deepEqual(st.map(s=>s.id),['s2','s1']);assert.equal(st[1].notes,'x');
});
test('messages : union des deux côtés, triés par date, sans doublon',()=>{
 const b=root(trip('T',{messages:[{id:'m0',ts:1,text:'a'}]})),l=clone(b),r=clone(b);
 l.trips[0].messages.push({id:'ml',ts:30,text:'moi'});r.trips[0].messages.push({id:'mr',ts:20,text:'lui'});
 assert.deepEqual(M(b,l,r).trips[0].messages.map(m=>m.id),['m0','mr','ml']);
});
test('discussion d’un jour : même fusion',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].stages[0].chat.push({id:'c1',ts:2});r.trips[0].stages[0].chat.push({id:'c2',ts:1});
 assert.deepEqual(M(b,l,r).trips[0].stages[0].chat.map(c=>c.id),['c2','c1']);
});
test('listes (checklist, trajets, points d’intérêt) : éléments ajoutés des deux côtés conservés',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);
 l.trips[0].checklist.push({id:'k1',text:'tente'});r.trips[0].checklist.push({id:'k2',text:'réchaud'});
 l.trips[0].transports.push({id:'t1'});r.trips[0].pois.push({id:'p1'});
 const t=M(b,l,r).trips[0];assert.deepEqual(t.checklist.map(x=>x.id).sort(),['k1','k2']);assert.equal(t.transports.length,1);assert.equal(t.pois.length,1);
});
test('un élément de liste modifié des deux côtés sur des champs différents : fusionné',()=>{
 const b=root(trip('T',{checklist:[{id:'k',text:'tente',who:'',done:false}]})),l=clone(b),r=clone(b);
 l.trips[0].checklist[0].done=true;r.trips[0].checklist[0].who='Bob';
 const k=M(b,l,r).trips[0].checklist[0];assert.equal(k.done,true);assert.equal(k.who,'Bob');
});
test('participants : bloc atomique, le nôtre l’emporte si modifié ici, sinon celui d’ailleurs',()=>{
 let b=root(trip('T')),l=clone(b),r=clone(b);r.trips[0].participants=['A','B','C'];assert.deepEqual(M(b,l,r).trips[0].participants,['A','B','C']);
 b=root(trip('T'));l=clone(b);r=clone(b);l.trips[0].participants=['A'];r.trips[0].participants=['A','B','C'];assert.deepEqual(M(b,l,r).trips[0].participants,['A']);
});
test('champ ajouté ici seulement / ajouté ailleurs seulement / supprimé ici',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].cover='img';r.trips[0].extra='x';delete l.trips[0].start;
 const t=M(b,l,r).trips[0];assert.equal(t.cover,'img');assert.equal(t.extra,'x');assert.ok(!('start' in t));
});
test('la fusion se fait sur place : un objet modifié des deux côtés garde son identité locale',()=>{
 const b=root(trip('T')),l=clone(b),r=clone(b);l.trips[0].title='moi';r.trips[0].start='2026-01-01';l.trips[0].stages[0].notes='a';r.trips[0].stages[0].name='b';
 const tl=l.trips[0],sl=l.trips[0].stages[0];const m=M(b,l,r);
 assert.equal(m,l);assert.equal(m.trips[0],tl);assert.equal(m.trips[0].stages[0],sl);
});
test('fusion idempotente : fusionner avec soi-même ne change rien',()=>{const b=root(trip('T')),l=clone(b);l.trips[0].title='x';const before=clone(l);assert.ok(eq(M(b,l,clone(l)),before))});
test('plusieurs enregistrements successifs : la 2e fusion repart de la nouvelle base',()=>{
 const base1=root(trip('T')),l=clone(base1),r=clone(base1);l.trips[0].title='v1';r.trips[0].start='2026-01-01';
 const m1=M(base1,l,r);                                  // 1er enregistrement
 const base2=clone(m1),l2=clone(m1),r2=clone(m1);        // nouvelle base = ce qui vient d'être écrit
 l2.trips[0].stages[0].notes='v2';r2.trips[0].stages[1].notes='autre';
 const m2=M(base2,l2,r2).trips[0];assert.equal(m2.title,'v1');assert.equal(m2.start,'2026-01-01');assert.equal(m2.stages[0].notes,'v2');assert.equal(m2.stages[1].notes,'autre');
});
test('position d’un hébergement (ll) : bloc atomique, la nôtre l’emporte si modifiée ici',()=>{
 const b=root(trip('T',{preLodging:{name:'H',ll:[1,1]}})),l=clone(b),r=clone(b);
 l.trips[0].preLodging.ll=[2,2];r.trips[0].preLodging.ll=[3,3];r.trips[0].preLodging.name='Autre nom';
 const p=M(b,l,r).trips[0].preLodging;assert.deepEqual(p.ll,[2,2]);assert.equal(p.name,'Autre nom');
});
