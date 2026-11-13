/* Configuration locale (dépôt GitHub, token, prénom) et import via lien #cfg=. */

export function guess(){const h=location.hostname,p=location.pathname.split('/')[1]||'';
 return h.endsWith('github.io')?{owner:h.split('.')[0],repo:(p&&!p.includes('.'))?p:h}:{}}
(function(){const m=location.hash.match(/^#cfg=(.+)$/);if(!m)return;
 try{const o=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')))));
  localStorage.setItem('tp_cfg',JSON.stringify(o));window.__imp=1}catch(e){}
 history.replaceState(null,'',location.pathname+location.search)})();
export const C=Object.assign({path:'data.json',branch:'main',dir:'data'},guess(),JSON.parse(localStorage.getItem('tp_cfg')||'{}'));
