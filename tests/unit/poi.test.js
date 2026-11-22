import test from 'node:test';import assert from 'node:assert/strict';
import {POI_T,poiType,poiQuery} from '../../js/lib/poi.js';
test('poiType : classe les étiquettes OpenStreetMap',()=>{
 const T=(t)=>poiType(t);
 assert.equal(T({amenity:'drinking_water'}),'water');assert.equal(T({natural:'spring'}),'water');assert.equal(T({tourism:'camp_site'}),'camp');
 assert.equal(T({amenity:'shelter'}),'camp');assert.equal(T({tourism:'chalet'}),'gite');assert.equal(T({tourism:'hostel'}),'gite');
 assert.equal(T({tourism:'guest_house'}),'bnb');assert.equal(T({tourism:'hotel'}),'hotel');assert.equal(T({amenity:'toilets'}),'wc');
 assert.equal(T({amenity:'pub'}),'bar');assert.equal(T({amenity:'cafe'}),'bar');assert.equal(T({amenity:'restaurant'}),'resto');
 assert.equal(T({shop:'bakery'}),'shop');assert.equal(T({foo:'bar'}),'other');
});
test('POI_T : 12 types, ceux qui se cherchent ont des filtres',()=>{
 assert.equal(Object.keys(POI_T).length,12);
 ['water','wc','shop','resto','bar','camp','gite','bnb','hotel'].forEach(k=>assert.ok(POI_T[k].q.length>0,k));
 ['view','danger','other'].forEach(k=>assert.equal(POI_T[k].q,undefined,k));
});
test('poiQuery : zone, rayon, polyligne et filtres présents ; taille raisonnable',()=>{
 const line=Array.from({length:400},(_,i)=>[48.7+i*0.0002,-3.4+i*0.0003]);
 const q=poiQuery(['water','hotel'],500,line);
 assert.match(q,/^\[out:json\]\[timeout:25\]\[bbox:/);assert.match(q,/around:500,/);assert.match(q,/drinking_water/);assert.match(q,/hotel\|motel/);
 assert.ok(!/shop/.test(q));assert.ok((q.match(/,/g)||[]).length<400,'polyligne simplifiée');
 assert.match(q,/out center tags;$/);
});
