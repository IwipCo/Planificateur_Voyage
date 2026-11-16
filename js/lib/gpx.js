/* Construction d'un fichier GPX 1.1 (pur). */
import {cumul} from './track.js';

const X=s=>String(s==null?'':s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
/* altitude interpolée à km kilomètres du départ (d = km croissants, z = altitudes) */
export function eleAt(e,km){
 if(!e||!e.d||e.d.length<2)return null;
 const d=e.d,z=e.z;if(km<=d[0])return z[0];if(km>=d[d.length-1])return z[z.length-1];
 let i=1;while(i<d.length-1&&d[i]<km)i++;
 const f=(km-d[i-1])/((d[i]-d[i-1])||1);return z[i-1]+(z[i]-z[i-1])*f;
}
export const slug=s=>String(s||'voyage').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'voyage';
/* days : [{name, line:[[lat,lng]…], elev?:{d,z}}] ; pois : [{name,lat,lng,type,note}] */
export function buildGpx({name,days,pois=[],now=new Date()}){
 const o=['<?xml version="1.0" encoding="UTF-8"?>','<gpx version="1.1" creator="Carnet de route" xmlns="http://www.topografix.com/GPX/1/1">',
  `<metadata><name>${X(name)}</name><time>${now.toISOString()}</time></metadata>`];
 for(const p of pois)o.push(`<wpt lat="${(+p.lat).toFixed(5)}" lon="${(+p.lng).toFixed(5)}"><name>${X(p.name||p.type||'Point')}</name>${p.note?`<desc>${X(p.note)}</desc>`:''}${p.type?`<type>${X(p.type)}</type>`:''}</wpt>`);
 for(const d of days){
  if(!d.line||d.line.length<2)continue;
  const c=cumul(d.line);
  o.push(`<trk><name>${X(d.name)}</name><trkseg>`);
  d.line.forEach((p,i)=>{
   const ele=eleAt(d.elev,c[i]/1000);
   o.push(`<trkpt lat="${(+p[0]).toFixed(5)}" lon="${(+p[1]).toFixed(5)}">${ele==null?'':`<ele>${ele.toFixed(1)}</ele>`}</trkpt>`);
  });
  o.push('</trkseg></trk>');
 }
 o.push('</gpx>');return o.join('\n');
}
