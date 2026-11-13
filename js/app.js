/* Rendu global et démarrage. */
import {$, em} from './lib/util.js';
import {C} from './config.js';
import {S} from './state.js';
import {loadAll} from './store.js';
import {toast} from './ui.js';
import {drawMap} from './map.js';
import {setGR} from './routing.js';
import {renderList} from './stages.js';
import {renderChat} from './chat.js';
import {renderBudget} from './budget.js';
import {renderCheck} from './checklist.js';
import {renderRecap} from './recap.js';
import {drawTrans, geoTrans} from './transmap.js';
import {drawCov, drawPois} from './poi.js';
import {pickTrip, route} from './home.js';
import {applyTabs, openSet, renderTrip} from './trip.js';

export function renderAll(fit){
 const run=f=>{try{f()}catch(e){console.error(e);toast('Erreur d’affichage : '+em(e))}};
 run(()=>{$('#title').value=S.D.title;document.title=S.D.title});run(renderList);run(renderChat);run(renderTrip);run(renderRecap);run(renderBudget);run(renderCheck);run(()=>drawMap(fit));run(drawTrans);run(drawPois);run(drawCov);run(applyTabs);run(()=>geoTrans());
}
export function init(){
document.querySelectorAll('dialog').forEach(dl=>{
 let down=null;
 dl.addEventListener('mousedown',e=>{down=e.target});
 dl.addEventListener('click',e=>{if(e.target===dl&&down===dl)dl.close();down=null});
});
(async()=>{
 setGR(S.grOn);
 try{await loadAll()}catch(e){toast('Chargement impossible : '+em(e))}
 if(!location.hash&&S.ALL.trips.length){const t=pickTrip();if(t)history.replaceState(null,'','#t='+t.id)}
 await route();
 if(window.__imp)toast('Configuration importée.'+(C.me?' Tu es '+C.me+'.':''));
 else if(!C.me)openSet();
})();
}
