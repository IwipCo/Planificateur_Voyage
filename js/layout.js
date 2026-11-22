/* Mise en page : carte en plein écran, et en-tête qui se replie quand on fait défiler (téléphone en portrait). */
import {$} from './lib/util.js';
import {map} from './mapcore.js';

let full=false,lastY=0;
export function setFull(v){
 full=v;
 $('#mapwrap').classList.toggle('mapfull',v);                   // plein écran « CSS » : fonctionne partout (iPhone compris)
 const b=$('#bfull');b.classList.toggle('on',v);b.textContent=v?'✕':'⛶';b.title=v?'Quitter le plein écran':'Carte en plein écran';
 try{                                                          // en plus, vrai plein écran quand le navigateur le permet (masque la barre d'adresse)
  const de=document.documentElement;
  if(v&&de.requestFullscreen&&!document.fullscreenElement)de.requestFullscreen().catch(()=>{});
  if(!v&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
 }catch(e){}
 setTimeout(()=>map.invalidateSize(),80);
}
export function init(){
 $('#bfull').onclick=()=>setFull(!full);
 document.addEventListener('fullscreenchange',()=>{if(full&&!document.fullscreenElement)setFull(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&full)setFull(false)});
 window.addEventListener('hashchange',()=>{if(full)setFull(false)});
 const t=$('#trip');
 t.addEventListener('scroll',()=>{                             // défilement vers le bas : l'en-tête se replie ; vers le haut : il revient
  if(!window.matchMedia('(max-width:899px)').matches)return;
  const y=t.scrollTop;
  if(y>lastY+6&&y>90)t.classList.add('hh');
  else if(y<lastY-6||y<40)t.classList.remove('hh');
  lastY=y;
 },{passive:true});
}
