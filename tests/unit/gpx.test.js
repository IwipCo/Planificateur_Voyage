import test from 'node:test';import assert from 'node:assert/strict';
import {buildGpx,eleAt,slug} from '../../js/lib/gpx.js';
const line=[[48.7,-3.4],[48.75,-3.3],[48.8,-3.2]];
test('eleAt : interpolation et bornes',()=>{
 const e={d:[0,10],z:[100,200]};assert.equal(eleAt(e,0),100);assert.equal(eleAt(e,5),150);assert.equal(eleAt(e,50),200);assert.equal(eleAt(null,1),null);
});
test('buildGpx : en-tête GPX 1.1, une piste par jour, un point par sommet',()=>{
 const x=buildGpx({name:'GR34 <test> & co',days:[{name:'J1',line},{name:'J2',line:[[1,1],[2,2]]}],now:new Date('2026-01-01T00:00:00Z')});
 assert.match(x,/^<\?xml version="1.0" encoding="UTF-8"\?>/);assert.match(x,/<gpx version="1.1"[^>]*xmlns="http:\/\/www.topografix.com\/GPX\/1\/1">/);
 assert.equal((x.match(/<trk>/g)||[]).length,2);assert.equal((x.match(/<trkpt /g)||[]).length,5);
 assert.match(x,/GR34 &lt;test&gt; &amp; co/);assert.match(x,/lat="48.70000" lon="-3.40000"/);assert.ok(x.trim().endsWith('</gpx>'));
});
test('buildGpx : altitudes interpolées le long de la trace si un profil existe',()=>{
 const tot=14;const x=buildGpx({name:'t',days:[{name:'J1',line,elev:{d:[0,tot/2,tot],z:[0,100,0]}}]});
 const el=[...x.matchAll(/<ele>([\d.]+)<\/ele>/g)].map(m=>+m[1]);assert.equal(el.length,3);assert.ok(el[1]>el[0]&&el[1]>el[2],el.join());
});
test('buildGpx : points d’intérêt en <wpt>, sans altitude si pas de profil',()=>{
 const x=buildGpx({name:'t',days:[{name:'J1',line}],pois:[{name:'Fontaine & lavoir',lat:48.71,lng:-3.39,type:'Points d’eau',note:'potable'}]});
 assert.match(x,/<wpt lat="48.71000" lon="-3.39000"><name>Fontaine &amp; lavoir<\/name><desc>potable<\/desc>/);assert.ok(!/<ele>/.test(x));
});
test('buildGpx : ignore un jour sans tracé',()=>{assert.equal((buildGpx({name:'t',days:[{name:'vide',line:[[1,1]]}]}).match(/<trk>/g)||[]).length,0)});
test('slug : nom de fichier propre',()=>{assert.equal(slug('GR34 : Lannion → Paimpol'),'gr34-lannion-paimpol');assert.equal(slug('Été à Ouessant !'),'ete-a-ouessant');assert.equal(slug(''),'voyage')});
