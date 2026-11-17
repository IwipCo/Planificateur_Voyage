/* Outils purs sur un tracé : abscisse curviligne, repères kilométriques, découpe, inversion du sens. */
import {dm} from './geo.js';

export function cumul(line){const c=[0];for(let i=1;i<line.length;i++)c.push(c[i-1]+dm(line[i-1],line[i]));return c}
/* point situé à m mètres du départ (cum = cumul(line)) */
export function pointAt(line,cum,m){
 let j=1;while(j<line.length-1&&cum[j]<m)j++;
 const a=line[j-1],b=line[j],span=cum[j]-cum[j-1],f=span?Math.max(0,Math.min(1,(m-cum[j-1])/span)):0;
 return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
}
export const KM_STEPS=[0.5,1,2,3,5,8,10,15,20,25,50,100];
/* pas des repères : environ un repère tous les 80 pixels, arrondi à un pas « rond » (loin : 10, 5 km… ; près : 2, 1, 0,5 km) */
export function kmStepFor(zoom,lat){
 const mpp=156543.03*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom),want=mpp*80/1000;
 return KM_STEPS.find(s=>s>=want)||KM_STEPS[KM_STEPS.length-1];
}
/* repères tous les stepKm kilomètres depuis le départ ; le dernier est omis s'il tombe trop près de l'arrivée */
export function kmMarks(line,stepKm){
 if(line.length<2)return[];
 const c=cumul(line),tot=c[c.length-1],out=[];
 for(let n=1;n*stepKm*1000<tot-stepKm*250;n++){const p=pointAt(line,c,n*stepKm*1000);out.push({km:Math.round(n*stepKm*10)/10,lat:p[0],lng:p[1]})}
 return out;
}
/* inverse l'ordre des repères ; l'indicateur « tronçon précédent en ligne droite » (3e valeur) suit le tronçon, pas le point */
export function reversePoints(pts){
 const n=pts.length;
 return pts.slice().reverse().map((p,j)=>j>0&&pts[n-j][2]?[p[0],p[1],1]:[p[0],p[1]]);
}
export function fmtDur(sec){const m=Math.round(sec/60);return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')}
