/* Revêtement d'un tracé d'après les voies OpenStreetMap proches (pur : aucune requête ici). */
import {proj} from './geo.js';
import {cumul,pointAt,thinLine} from './track.js';

export const SURF={
 paved:{l:'Revêtu (route, pavé)',c:'#6c757d'},
 gravel:{l:'Gravier, chemin stabilisé',c:'#f4a261'},
 dirt:{l:'Terre, herbe, sable',c:'#8d6e3f'},
 rock:{l:'Rocher, pierre',c:'#7b6d8d'},
 path:{l:'Sentier ou piste (revêtement non renseigné)',c:'#2a9d8f'},
 road:{l:'Route (revêtement non renseigné)',c:'#adb5bd'},
 unknown:{l:'Inconnu (aucune voie trouvée)',c:'#dee2e6'}
};
const PAVED=['asphalt','paved','concrete','concrete:plates','concrete:lanes','paving_stones','sett','cobblestone','unhewn_cobblestone','metal','wood','bricks'];
const GRAVEL=['gravel','fine_gravel','compacted','pebblestone','crushed_stone'];
const DIRT=['dirt','earth','ground','mud','sand','grass','grass_paver','soil','clay'];
const ROCK=['rock','stone','bare_rock','rocks'];
const TRAILS=['path','footway','bridleway','steps','track'];
export function classify(t){
 const s=String(t.surface||'').split(';')[0].trim();
 if(PAVED.includes(s))return'paved';
 if(GRAVEL.includes(s))return'gravel';
 if(DIRT.includes(s))return'dirt';
 if(ROCK.includes(s))return'rock';
 const h=t.highway;
 if(TRAILS.includes(h)){
  if(t.tracktype==='grade1')return'paved';
  if(t.tracktype==='grade2')return'gravel';
  if(['grade3','grade4','grade5'].includes(t.tracktype))return'dirt';
  return'path';
 }
 return h?'road':'unknown';
}
/* éléments Overpass (way + geometry + tags) -> voies prêtes à l'emploi */
export function prepWays(elements,padM=40){
 const pad=padM/111000,out=[];
 for(const e of elements||[]){
  if(e.type!=='way'||!e.geometry||e.geometry.length<2||!(e.tags&&e.tags.highway))continue;
  const g=e.geometry.map(p=>[p.lat,p.lon]),la=g.map(p=>p[0]),lo=g.map(p=>p[1]);
  out.push({g,t:classify(e.tags),bb:[Math.min(...la)-pad,Math.min(...lo)-pad,Math.max(...la)+pad,Math.max(...lo)+pad]});
 }
 return out;
}
/* un échantillon tous les stepM mètres : type de la voie la plus proche (à moins de maxM mètres) */
export function sampleTypes(line,ways,stepM=40,maxM=25){
 const cum=cumul(line),total=cum[cum.length-1],res=[];
 for(let m=stepM/2;m<total;m+=stepM){
  const p=pointAt(line,cum,m);let best=null,bd=1e9;
  for(const w of ways){
   if(p[0]<w.bb[0]||p[0]>w.bb[2]||p[1]<w.bb[1]||p[1]>w.bb[3])continue;
   const d=proj(w.g,p).d;if(d<bd){bd=d;best=w}
  }
  res.push(best&&bd<=maxM?best.t:'unknown');
 }
 return res;
}
/* échantillons -> segments [début m, fin m, type] fusionnés ; offset = abscisse du début du tronçon */
export function toRle(types,stepM,offset,totalM){
 const out=[];
 types.forEach((t,i)=>{
  const a=offset+i*stepM,b=Math.min(offset+(i+1)*stepM,offset+(totalM!=null?totalM:1e12));
  const l=out[out.length-1];
  if(l&&l[2]===t&&Math.abs(l[1]-a)<1e-6)l[1]=b;else out.push([a,b,t]);
 });
 return out;
}
export function mergeRle(parts){
 const out=[];
 for(const r of parts){const l=out[out.length-1];if(l&&l[2]===r[2]&&Math.abs(l[1]-r[0])<2)l[1]=r[1];else out.push([r[0],r[1],r[2]])}
 return out;
}
export function summarize(rle){
 const km={};let tot=0;
 for(const[a,b,t]of rle){km[t]=(km[t]||0)+(b-a)/1000;tot+=(b-a)/1000}
 return{km,total:tot};
}

/* requête Overpass : voies (highway) à moins de 25 m d'un tracé, géométrie rognée à la zone */
export function surfQuery(pts){
 const sel=thinLine(pts,120,150),la=pts.map(p=>p[0]),lo=pts.map(p=>p[1]),pad=0.0006;
 const bb=[Math.min(...la)-pad,Math.min(...lo)-pad,Math.max(...la)+pad,Math.max(...lo)+pad].map(v=>v.toFixed(5)).join(',');
 return '[out:json][timeout:25][bbox:'+bb+'];way["highway"](around:25,'+sel.map(p=>p[0].toFixed(5)+','+p[1].toFixed(5)).join(',')+');out tags geom('+bb+');';
}
