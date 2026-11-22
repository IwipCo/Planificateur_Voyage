import test from 'node:test';import assert from 'node:assert/strict';
import {esc,iso,addD,fmtD,eur,hue,wmo,cardinal,tideExt} from '../../js/lib/util.js';
test('esc : échappe le HTML',()=>{assert.equal(esc('<b a="x">&'),'&lt;b a=&quot;x&quot;&gt;&amp;');assert.equal(esc(null),'');});
test('iso/addD : dates locales, passage de mois et d’année',()=>{
 assert.equal(addD('2026-01-31',1),'2026-02-01');assert.equal(addD('2026-12-31',1),'2027-01-01');assert.equal(addD('2026-03-01',-1),'2026-02-28');
 assert.equal(iso(new Date(2026,5,9)),'2026-06-09');
});
test('fmtD : vide si pas de date',()=>{assert.equal(fmtD(''),'');assert.match(fmtD('2026-11-12'),/12/)});
test('eur : format français',()=>{assert.match(eur(1234.5),/1\s?234,50\s?€/)});
test('hue : stable et dans [0,360[',()=>{assert.equal(hue('abc'),hue('abc'));assert.ok(hue('x1')>=0&&hue('x1')<360)});
test('wmo : codes météo',()=>{assert.equal(wmo(0)[1],'Dégagé');assert.equal(wmo(63)[1],'Pluie');assert.equal(wmo(95)[1],'Orage')});
test('cardinal : directions',()=>{assert.equal(cardinal(0),'N');assert.equal(cardinal(90),'E');assert.equal(cardinal(270),'O');assert.equal(cardinal(359),'N')});
test('tideExt : retrouve ~4 marées par jour sur une sinusoïde de 12,4 h',()=>{
 const t=[],v=[];for(let i=0;i<48;i++){t.push(`2026-01-0${1+Math.floor(i/24)}T${String(i%24).padStart(2,'0')}:00`);v.push(3*Math.sin(i*2*Math.PI/12.4))}
 const e=tideExt(t,v,'2026-01-01');assert.ok(e.length>=3&&e.length<=5,String(e.length));
 e.forEach(x=>assert.match(x.t,/^\d\d:\d\d$/));assert.ok(e.some(x=>x.hi)&&e.some(x=>!x.hi));
});
