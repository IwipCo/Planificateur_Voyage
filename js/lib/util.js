/* Utilitaires purs (aucune dépendance au DOM d’application) : dates, échappement HTML, formats, réseau. */

export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const COL=['#e4572e','#2e86ab','#76b041','#a23b72','#d9a441','#17bebb','#7768ae','#d1495b'];
export const em=e=>e instanceof SyntaxError?'fichier illisible':(e&&e.message==='404'?'introuvable':(e&&e.message?e.message:String(e)));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function fetchT(u,ms=12000,init={}){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
 try{return await fetch(u,{...init,signal:c.signal})}finally{clearTimeout(t)}
}
export const wmo=c=>c===0?['☀️','Dégagé']:c<=2?['🌤','Peu nuageux']:c===3?['☁️','Couvert']:c<=48?['🌫','Brouillard']:c<=57?['🌦','Bruine']:c<=67?['🌧','Pluie']:c<=77?['🌨','Neige']:c<=82?['🌦','Averses']:['⛈','Orage'];
export const cardinal=d=>['N','NE','E','SE','S','SO','O','NO'][Math.round(d/45)%8];
export function tideExt(t,v,date){
 const out=[];
 for(let i=1;i<v.length-1;i++){
  const a=v[i-1],b=v[i],c=v[i+1];
  if(a==null||b==null||c==null||t[i].slice(0,10)!==date)continue;
  const hi=b>=a&&b>c,lo=b<=a&&b<c;if(!hi&&!lo)continue;
  const den=a-2*b+c,x=den?0.5*(a-c)/den:0,z=den?b-(c-a)*(c-a)/(8*den):b;
  const mn=Math.round(parseInt(t[i].slice(11,13))*60+parseInt(t[i].slice(14,16))+x*60);
  const hh=Math.floor((((mn%1440)+1440)%1440)/60),mm=((mn%60)+60)%60;
  out.push({hi,z,t:String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')});
 }
 return out;
}
export function fmtD(d){return d?new Date(d+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):''}
export const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
export const addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return iso(d)};
export const fmtDT=v=>v?new Date(v).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'?';
export const eur=n=>n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
export const hue=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))%360;return h};
export const fmtY=d=>new Date(d+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
