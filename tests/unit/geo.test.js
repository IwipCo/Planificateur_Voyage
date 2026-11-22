import test from 'node:test';import assert from 'node:assert/strict';
import {dm,proj,densify,chunkInfo,midOf} from '../../js/lib/geo.js';
test('dm : distance connue Paris-Lyon ≈ 392 km',()=>{const d=dm([48.8566,2.3522],[45.7640,4.8357])/1000;assert.ok(d>388&&d<396,String(d))});
test('dm : symétrique et nulle sur un même point',()=>{assert.equal(dm([48,-3],[48,-3]),0);assert.ok(Math.abs(dm([48,-3],[49,-2])-dm([49,-2],[48,-3]))<1e-6)});
test('densify : insère des points tous les ~1 km sans changer les extrémités',()=>{const l=[[48,-3],[48.1,-3]];const o=densify(l);assert.ok(o.length>=11);assert.deepEqual(o[0],l[0]);assert.ok(Math.abs(o.at(-1)[0]-48.1)<1e-9)});
test('chunkInfo : tronçons contigus, d’environ 6 km, qui couvrent tout le tracé',()=>{
 const line=[[48.70,-3.40],[48.80,-3.20]];const ch=chunkInfo(line);const tot=dm(line[0],line[1]);
 assert.ok(ch.length>=2);assert.equal(ch[0].a,0);
 for(let i=1;i<ch.length;i++)assert.ok(Math.abs(ch[i].a-ch[i-1].b)<1);
 assert.ok(Math.abs(ch.at(-1).b-tot)<tot*0.01);
 ch.slice(0,-1).forEach(c=>assert.ok(c.b-c.a>=5990&&c.b-c.a<7500));
 assert.ok(ch.at(-1).b-ch.at(-1).a>=1500,'pas de dernier tronçon minuscule');
});
test('chunkInfo : un tracé court reste en un seul tronçon',()=>{assert.equal(chunkInfo([[48,-3],[48.02,-3]]).length,1)});
test('proj : point sur le tracé -> distance ~0 et km correct',()=>{
 const line=[[48,-3],[48.1,-3]];const p=[48.05,-3];const r=proj(line,p);
 assert.ok(r.d<1);assert.ok(Math.abs(r.km-dm(line[0],p)/1000)<0.05);
});
test('proj : point à ~1 km du tracé',()=>{const r=proj([[48,-3],[48.1,-3]],[48.05,-3+0.0135]);assert.ok(r.d>900&&r.d<1100,String(r.d))});
test('midOf : milieu d’un segment',()=>{const m=midOf([[48,-3],[48.2,-3]]);assert.ok(Math.abs(m[0]-48.1)<1e-3)});
