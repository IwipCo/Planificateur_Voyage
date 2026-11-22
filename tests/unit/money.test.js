import test from 'node:test';import assert from 'node:assert/strict';
import {settle} from '../../js/lib/money.js';
const P=['Alice','Bob','Chloé'];
test('dépense partagée : le payeur est remboursé par les autres',()=>{
 const r=settle([{amt:90,payer:'Alice',who:P}],P,[]);
 assert.equal(r.bal.Alice.net,60);assert.equal(r.bal.Bob.net,-30);
 assert.deepEqual(r.tr.map(t=>[t.from,t.to,t.amt]).sort(),[['Bob','Alice',30],['Chloé','Alice',30]]);
});
test('la somme des soldes est toujours nulle',()=>{
 const E=[{amt:100,payer:'Alice',who:['Alice','Bob']},{amt:33.33,payer:'Bob',who:P},{amt:7.1,payer:'Chloé',who:['Bob']}];
 const r=settle(E,P,[]);const sum=Object.values(r.bal).reduce((a,b)=>a+b.net,0);assert.ok(Math.abs(sum)<0.02,String(sum));
});
test('les remboursements enregistrés réduisent les dettes',()=>{
 const E=[{amt:100,payer:'Alice',who:['Alice','Bob']}];
 const r=settle(E,['Alice','Bob'],[{from:'Bob',to:'Alice',amt:50}]);
 assert.equal(r.tr.length,0);assert.equal(r.bal.Bob.net,0);
});
test('un remboursement partiel laisse le reste dû',()=>{
 const r=settle([{amt:100,payer:'Alice',who:['Alice','Bob']}],['Alice','Bob'],[{from:'Bob',to:'Alice',amt:20}]);
 assert.deepEqual(r.tr.map(t=>t.amt),[30]);
});
test('dépense sans payeur : comptée à part, ignorée du solde',()=>{
 const r=settle([{amt:40,payer:'',who:P}],P,[]);assert.equal(r.un,40);assert.equal(r.tr.length,0);
});
test('transferts : jamais plus que le nombre de participants - 1',()=>{
 const E=[{amt:100,payer:'Alice',who:P},{amt:50,payer:'Bob',who:P},{amt:10,payer:'Chloé',who:P}];
 assert.ok(settle(E,P,[]).tr.length<=2);
});
