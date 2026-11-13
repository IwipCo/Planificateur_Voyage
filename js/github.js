/* Accès à l’API GitHub (lecture / écriture du fichier de données). */
import {C} from './config.js';

export const api=p=>`https://api.github.com/repos/${C.owner}/${C.repo}/contents/${p}`;
export const hdr=()=>({Authorization:'Bearer '+C.token,Accept:'application/vnd.github+json'});
export const hasGh=()=>C.token&&C.owner&&C.repo;
export async function ghGet(p){
 const u=api(p)+'?ref='+C.branch+'&t='+Date.now();
 const r=await fetch(u,{headers:hdr(),cache:'no-store'});
 if(!r.ok)throw new Error(r.status);
 const j=await r.json();let txt;
 if(j.content&&j.encoding!=='none')txt=decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))));
 else{const r2=await fetch(u,{headers:{...hdr(),Accept:'application/vnd.github.raw+json'},cache:'no-store'});if(!r2.ok)throw new Error(r2.status);txt=await r2.text()}
 return{sha:j.sha,data:JSON.parse(txt)};
}
export async function ghPut(p,obj,sh,msg){
 const body={message:msg,branch:C.branch,content:btoa(unescape(encodeURIComponent(JSON.stringify(obj))))};
 if(sh)body.sha=sh;
 const r=await fetch(api(p),{method:'PUT',headers:hdr(),body:JSON.stringify(body)});
 if(!r.ok)throw new Error(r.status);
 return (await r.json()).content.sha;
}
