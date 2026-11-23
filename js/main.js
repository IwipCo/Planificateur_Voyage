/* Point d’entrée : charge les modules, branche les écouteurs puis démarre l’application. */
import * as m_lib_geo from './lib/geo.js';
import * as m_lib_util from './lib/util.js';
import * as m_state from './state.js';
import * as m_config from './config.js';
import * as m_stages from './stages.js';
import * as m_github from './github.js';
import * as m_store from './store.js';
import * as m_ui from './ui.js';
import * as m_mapcore from './mapcore.js';
import * as m_map from './map.js';
import * as m_lib_stage from './lib/stage.js';
import * as m_routing from './routing.js';
import * as m_names from './names.js';
import * as m_elevation from './elevation.js';
import * as m_weather from './weather.js';
import * as m_chat from './chat.js';
import * as m_lodging from './lodging.js';
import * as m_transports from './transports.js';
import * as m_budget from './budget.js';
import * as m_lib_money from './lib/money.js';
import * as m_checklist from './checklist.js';
import * as m_recap from './recap.js';
import * as m_transmap from './transmap.js';
import * as m_lib_poi from './lib/poi.js';
import * as m_poi from './poi.js';
import * as m_home from './home.js';
import * as m_trip from './trip.js';
import * as m_app from './app.js';
import * as m_tools from './tools.js';
import * as m_position from './position.js';
import * as m_layout from './layout.js';
import * as m_lodgmap from './lodgmap.js';
import * as m_exportgpx from './exportgpx.js';
import * as m_lib_track from './lib/track.js';
import * as m_lib_gpx from './lib/gpx.js';
import {S} from './state.js';
import {toast} from './ui.js';

const NS=[m_tools,m_position,m_layout,m_lodgmap,m_exportgpx,m_lib_track,m_lib_gpx,m_lib_geo,m_lib_util,m_state,m_config,m_stages,m_github,m_store,m_ui,m_mapcore,m_map,m_lib_stage,m_routing,m_names,m_elevation,m_weather,m_chat,m_lodging,m_transports,m_budget,m_lib_money,m_checklist,m_recap,m_transmap,m_lib_poi,m_poi,m_home,m_trip,m_app];

if(globalThis.__TP_TEST__){            // exposition pour les tests automatiques
 const tp={};NS.forEach(n=>Object.keys(n).forEach(k=>{if(k!=='init')tp[k]=n[k]}));
 Object.keys(S).forEach(k=>Object.defineProperty(tp,k,{get:()=>S[k],set:v=>{S[k]=v},configurable:true}));
 window.__tp=tp;
}
window.addEventListener('error',e=>{try{toast('Erreur inattendue : '+(e.message||''))}catch(x){}});
window.addEventListener('unhandledrejection',e=>{try{toast('Erreur inattendue : '+((e.reason&&e.reason.message)||e.reason))}catch(x){}});

// ordre identique à celui du script d’origine ; une erreur dans un module n'empêche pas les suivants (ni l'application) de démarrer
const run=f=>{try{f()}catch(e){console.error(e);toast('Erreur au démarrage : '+(e&&e.message||e))}};
run(m_map.init);
run(m_routing.init);
run(m_stages.init);
run(m_lodging.init);
run(m_chat.init);
run(m_budget.init);
run(m_checklist.init);
run(m_transmap.init);
run(m_poi.init);
run(m_home.init);
run(m_trip.init);
run(m_tools.init);
run(m_exportgpx.init);
run(m_position.init);
run(m_layout.init);
run(m_lodgmap.init);
run(m_app.init);

if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
 navigator.serviceWorker.register('sw.js').catch(()=>{});      // mode hors ligne (facultatif)
}
