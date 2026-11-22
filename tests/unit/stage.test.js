import test from 'node:test';import assert from 'node:assert/strict';
import {key,okRoute,dist,stLine,covSig,elevKey,samples} from '../../js/lib/stage.js';
const mk=(o={})=>({id:'s1',points:[[48.7,-3.4],[48.75,-3.3],[48.8,-3.2]],...o});
test('key : change quand un repère bouge, quand il est forcé ou en mode voiture',()=>{
 const a=key(mk()),b=key(mk({points:[[48.7,-3.4],[48.76,-3.3],[48.8,-3.2]]})),c=key(mk({points:[[48.7,-3.4],[48.75,-3.3,1],[48.8,-3.2]]})),d=key(mk({rmode:'car'}));
 assert.equal(new Set([a,b,c,d]).size,4);
});
test('key : le vélo et le moteur BRouter invalident aussi le tracé calculé',()=>{
 const a=key(mk()),b=key(mk({rmode:'bike'})),c=key(mk({engine:'brouter'})),d=key(mk({rmode:'foot',engine:'osrm'}));
 assert.equal(new Set([a,b,c]).size,3);assert.equal(a,d,'les valeurs par défaut ne changent pas la clé (itinéraires existants conservés)');
});
test('okRoute : valable seulement si la clé correspond',()=>{
 const s=mk();s.route=[[48.7,-3.4],[48.8,-3.2]];s.routeKey=key(s);assert.ok(okRoute(s));
 s.points.push([48.9,-3.1]);assert.ok(!okRoute(s));
});
test('dist : tracé valide -> routeKm ; sinon ligne droite entre repères',()=>{
 const s=mk();const straight=dist(s);assert.ok(straight>15&&straight<22,String(straight));
 s.route=[[48.7,-3.4],[48.8,-3.2]];s.routeKm=99;s.routeKey=key(s);assert.equal(dist(s),99);
});
test('stLine/covSig : suivent le tracé calculé quand il existe',()=>{
 const s=mk();assert.deepEqual(stLine(s),s.points);assert.match(covSig(s),/^p\|/);
 s.route=[[1,1],[2,2]];s.routeKey=key(s);assert.deepEqual(stLine(s),s.route);assert.match(covSig(s),/^r\|/);
});
test('elevKey : dépend du tracé et du calcul d’itinéraire',()=>{
 const s=mk();const a=elevKey(s);s.routeKey='x';assert.notEqual(elevKey(s),a);
});
test('samples : 2 à 300 échantillons, distances croissantes, extrémités respectées',()=>{
 const s=mk();const sm=samples(s);assert.ok(sm.length>=2&&sm.length<=300);
 assert.equal(sm[0].d,0);for(let i=1;i<sm.length;i++)assert.ok(sm[i].d>=sm[i-1].d);
 assert.ok(Math.abs(sm.at(-1).la-48.8)<1e-6);
});
