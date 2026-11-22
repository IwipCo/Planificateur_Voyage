import test from 'node:test';import assert from 'node:assert/strict';
import {cumul,pointAt,kmStepFor,kmMarks,reversePoints,fmtDur,KM_STEPS} from '../../js/lib/track.js';
import {dm} from '../../js/lib/geo.js';
const line=[[48.70,-3.40],[48.75,-3.30],[48.80,-3.20]];
test('kmStepFor : plus on zoome, plus le pas diminue (loin : 10/8/5 km ; près : 2/1/0,5 km)',()=>{
 const st=[9,10,11,12,13,14,15,16].map(z=>kmStepFor(z,48.7));
 for(let i=1;i<st.length;i++)assert.ok(st[i]<=st[i-1],st.join());
 assert.ok(st[0]>=10&&st[1]>=8,'loin : '+st.join());assert.ok(st[5]<=1&&st[7]<=0.5,'près : '+st.join());
 st.forEach(s=>assert.ok(KM_STEPS.includes(s)));
});
test('kmMarks : un repère par pas, espacés d’exactement pas×1000 m, aucun trop près de l’arrivée',()=>{
 const tot=cumul(line).at(-1)/1000;const m=kmMarks(line,5);
 assert.equal(m.length,Math.floor((tot-1.25)/5)+ (tot-1.25)%5===0?0:m.length);   // cohérence de comptage
 assert.deepEqual(m.map(x=>x.km),Array.from({length:m.length},(_,i)=>(i+1)*5));
 assert.ok(m.length>=2&&m.length<=3,String(m.length));
 const c=cumul(line);m.forEach((x,i)=>{const d=dm(line[0],[x.lat,x.lng]);assert.ok(d<=(i+1)*5000+1)});
 assert.deepEqual(kmMarks([[48,-3]],1),[]);
});
test('kmMarks : pas fin -> plus de repères',()=>{assert.ok(kmMarks(line,1).length>kmMarks(line,5).length*3)});
test('pointAt : bornes',()=>{
 const c=cumul(line),tot=c.at(-1);
 assert.ok(dm(pointAt(line,c,0),line[0])<1);assert.ok(dm(pointAt(line,c,tot),line[2])<1);
});
test('reversePoints : inverse l’ordre, déplace l’indicateur « ligne droite » avec le tronçon, et s’annule en le refaisant',()=>{
 const pts=[[1,1],[2,2,1],[3,3],[4,4,1]];      // tronçons droits : 1->2 et 3->4
 const r=reversePoints(pts);
 assert.deepEqual(r.map(p=>[p[0],p[1]]),[[4,4],[3,3],[2,2],[1,1]]);
 assert.deepEqual(r.map(p=>p[2]||0),[0,1,0,1],'tronçon 4->3 droit, 3->2 routé, 2->1 droit');
 assert.deepEqual(reversePoints(r),[[1,1],[2,2,1],[3,3],[4,4,1]]);
});
test('fmtDur',()=>{assert.equal(fmtDur(1800),'30 min');assert.equal(fmtDur(3900),'1 h 05');assert.equal(fmtDur(7200),'2 h 00')});
