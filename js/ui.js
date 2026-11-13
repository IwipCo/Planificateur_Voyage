/* Petits utilitaires d’interface : barre de statut, messages. */
import {$} from './lib/util.js';
import {warned} from './routing.js';

export function status(t){$('#st').textContent=t}
export function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',4000)}
export const warnOnce=(k,m)=>{if(warned.has(k))return;warned.add(k);toast(m)};
