/* Fonctions pures sur un jour (tracé, clés de validité, échantillonnage). */
import {dm} from './geo.js';

export const key=s=>s.points.map(p=>p.join(',')).join(';')+(s.rmode==='car'?'|car':'');
export const okRoute=s=>s.route&&s.routeKey===key(s);
export function dist(s){if(okRoute(s)&&s.routeKm!=null)return s.routeKm;let d=0;for(let i=1;i<s.points.length;i++)d+=dm(s.points[i-1],s.points[i]);return d/1000}
export const elevKey=s=>key(s)+'|'+(s.routeKey||'');
export function samples(s){
 const line=okRoute(s)?s.route:s.points,cum=[0];
 for(let i=1;i<line.length;i++)cum.push(cum[i-1]+dm(line[i-1],line[i]));
 const tot=cum[cum.length-1],n=Math.min(300,Math.max(2,Math.round(tot/50)+1)),out=[];let j=1;
 for(let k=0;k<n;k++){
  const t=tot*k/(n-1);while(j<cum.length-1&&cum[j]<t)j++;
  const f=cum[j]>cum[j-1]?(t-cum[j-1])/(cum[j]-cum[j-1]):0;
  out.push({d:t/1000,la:line[j-1][0]+(line[j][0]-line[j-1][0])*f,lo:line[j-1][1]+(line[j][1]-line[j-1][1])*f});
 }
 return out;
}
export const covSig=s=>okRoute(s)?'r|'+s.routeKey:'p|'+key(s);
export const stLine=s=>okRoute(s)?s.route:s.points;
