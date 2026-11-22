/* Banc d'essai : charge la vraie application (index.html + modules) dans jsdom, avec de faux services réseau. */
import {JSDOM} from 'jsdom';
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
let BUNDLE=null;
const bundle=()=>BUNDLE||(BUNDLE=esbuild.buildSync({entryPoints:[path.join(ROOT,'js/main.js')],bundle:true,format:'iife',write:false,logLevel:'silent'}).outputFiles[0].text);

export const b64=s=>Buffer.from(s).toString('base64');
export const unb=s=>Buffer.from(s,'base64').toString();
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
export const mkTrip=(id,title,start,end,extra={})=>({id,title,start,end,participants:['Alice','Bob'],stages:[],messages:[],transports:[],...extra});
export const defaultTrips=()=>[mkTrip('A','Loin',day(30),day(34)),mkTrip('B','Proche',day(5),day(9)),mkTrip('C','Sans date','',''),mkTrip('D','Passé',day(-40),day(-36))];

const ELEMENTS=[
 {type:'node',id:1,lat:48.7005,lon:-3.4,tags:{amenity:'drinking_water'}},
 {type:'node',id:2,lat:48.7600,lon:-3.45,tags:{amenity:'drinking_water'}},
 {type:'way',id:3,center:{lat:48.7502,lon:-3.2995},tags:{shop:'bakery',name:'Boulangerie',opening_hours:'Mo-Sa 07:00-19:00'}},
 {type:'node',id:4,lat:48.7503,lon:-3.3,tags:{natural:'spring',drinking_water:'no'}},
 {type:'node',id:5,lat:48.8,lon:-3.2005,tags:{amenity:'toilets'}},
 {type:'node',id:6,lat:48.7010,lon:-3.3995,tags:{tourism:'hotel',name:'Hôtel du Port'}},
 {type:'node',id:7,lat:48.7020,lon:-3.3990,tags:{tourism:'guest_house',name:'Chez Annie'}},
 {type:'node',id:8,lat:48.7030,lon:-3.3985,tags:{tourism:'chalet',name:'Gîte des Falaises'}},
 {type:'node',id:9,lat:48.7040,lon:-3.3980,tags:{amenity:'pub',name:'Le Marin'}},
 {type:'node',id:10,lat:48.7050,lon:-3.3975,tags:{amenity:'restaurant',name:'Crêperie'}},
 {type:'node',id:11,lat:48.7060,lon:-3.3970,tags:{tourism:'camp_site',name:'Camping de la plage'}}
];

export async function makeApp(opts={}){
 const ctx={
  FS:{},puts:[],urls:[],qs:[],ovc:0,ovFail:0,failAll:false,
  elev:{om:'error',ot:'ok',oe:'ok'},          // 'ok' | 'error' | 'http500'
  elements:ELEMENTS,brouter:'ok',downloads:[],calls:{routing:0,elev:0,geo:0,brouter:0},...(opts.ctx||{})
 };
 let n=0;
 if(opts.files)Object.assign(ctx.FS,opts.files);
 else ctx.FS['data.json']={content:b64(JSON.stringify({version:2,trips:opts.trips||defaultTrips()})),sha:'s0'};
 const cfg=opts.cfg===undefined?{owner:'o',repo:'r',token:'tok',me:'Alice'}:opts.cfg;
 let html=read('index.html');
 const css=read('css/style.css'),leaf=fs.readFileSync(path.join(ROOT,'vendor/leaflet/leaflet.js'),'utf8');
 html=html.replace('<link rel="stylesheet" href="vendor/leaflet/leaflet.css">','').replace('<link rel="stylesheet" href="css/style.css">','<style>'+css+'</style>')
  .replace('<script src="vendor/leaflet/leaflet.js"></script>',()=>'<script>'+leaf+'</script>')
  .replace('<script type="module" src="js/main.js"></script>',()=>'<script>'+bundle()+'</script>');
 const errors=[],logs=[];
 const J=(o,s=200)=>({ok:s>=200&&s<300,status:s,json:async()=>o,text:async()=>JSON.stringify(o)});
 const fetchStub=async(u,o={})=>{
  u=String(u);
  if(opts.hook){const r=await opts.hook(u,o,ctx);if(r)return r}
  if(u.includes('open-meteo.com/v1/elevation')){ctx.calls.elev++;const m=ctx.elev.om;if(m==='error')return J({error:true,reason:'simulé : indisponible'});if(m==='http500')return J({},500);const k=u.split('latitude=')[1].split('&')[0].split(',').length;return J({elevation:Array.from({length:k},(_,i)=>10+i%7*3)})}
  if(u.includes('opentopodata')){const m=ctx.elev.ot;if(m==='error')return J({error:'simulé : saturé'});if(m==='http500')return J({},500);const k=decodeURIComponent(u.split('locations=')[1]).split('|').length;return J({results:Array.from({length:k},(_,i)=>({elevation:10+i%7*3}))})}
  if(u.includes('open-elevation')){const m=ctx.elev.oe;if(m!=='ok')return J({},500);const k=decodeURIComponent(u.split('locations=')[1]).split('|').length;return J({results:Array.from({length:k},(_,i)=>({elevation:20+i%9*2}))})}
  if(u.includes('routing.openstreetmap.de')){ctx.calls.routing++;ctx.urls.push(u.split('/')[3]+' '+u.split('driving/')[1].split('?')[0].split(';').length+'pts');return J({code:'Ok',routes:[{distance:5000,duration:3600,geometry:{coordinates:[[-3.4,48.7],[-3.3,48.75],[-3.2,48.8]]}}]})}
  if(u.includes('brouter.de')){ctx.calls.brouter++;ctx.urls.push('brouter '+u.split('profile=')[1].split('&')[0]);if(ctx.brouter!=='ok')return J({},500);return J({features:[{geometry:{coordinates:[[-3.4,48.7,10],[-3.3,48.75,30],[-3.2,48.8,20]]},properties:{'track-length':'18000','total-time':'12000'}}]})}
  if(u.includes('overpass')){ctx.qs.push(o.body||u);ctx.ovc++;if(ctx.failAll||ctx.ovc<=ctx.ovFail)return J({},504);return J({elements:ctx.elements})}
  if(u.includes('nominatim')){ctx.calls.geo++;if(u.includes('/search'))ctx.calls.search=(ctx.calls.search||0)+1;const q=decodeURIComponent((u.split('q=')[1]||'')),P={Rennes:[48.11,-1.68],Lannion:[48.73,-3.46]};return J(P[q]?[{lat:P[q][0],lon:P[q][1]}]:[{lat:48.1,lon:-1.6,address:{city:'Ville'}}])}
  if(u.includes('api.open-meteo.com/v1/forecast'))return J({daily:{time:['x'],weather_code:[2],temperature_2m_max:[18],temperature_2m_min:[9],precipitation_sum:[0.4],precipitation_probability_max:[30],wind_speed_10m_max:[22],wind_gusts_10m_max:[40],wind_direction_10m_dominant:[250],sunrise:['2026-01-01T08:00'],sunset:['2026-01-01T17:00']}});
  if(u.includes('marine-api.open-meteo.com'))return J({hourly:{time:Array.from({length:48},(_,i)=>`2026-01-0${1+Math.floor(i/24)}T${String(i%24).padStart(2,'0')}:00`),sea_level_height_msl:Array.from({length:48},(_,i)=>3*Math.sin(i*2*Math.PI/12.4))}});
  const m=u.match(/contents\/([^?]+)/);
  if(m){
   const p=decodeURIComponent(m[1]),meth=o.method||'GET',f=ctx.FS[p];
   if(meth==='GET'){if(!f)return J({},404);if((o.headers||{}).Accept&&/raw/.test(o.headers.Accept))return{ok:true,status:200,text:async()=>f.raw};return J({sha:f.sha,content:f.content,encoding:f.encoding})}
   const b=JSON.parse(o.body);
   if(meth==='PUT'){if(f&&b.sha!==f.sha)return J({},409);ctx.FS[p]={content:b.content,sha:'n'+(++n)};ctx.puts.push(p);return J({content:{sha:ctx.FS[p].sha}})}
   if(meth==='DELETE'){delete ctx.FS[p];return J({})}
  }
  return J({},404);
 };
 const dom=new JSDOM(html,{runScripts:'dangerously',url:opts.url||'https://u.github.io/voyage/',pretendToBeVisual:true,beforeParse(w){
  w.__TP_TEST__=true;w.structuredClone=structuredClone;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
  if(cfg)w.localStorage.setItem('tp_cfg',JSON.stringify(cfg));
  Object.entries(opts.storage||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
  w.Blob=class{constructor(parts,o){this.parts=parts;this.type=o&&o.type}};w.URL.createObjectURL=b=>{ctx.lastBlob=b;return'blob:test'};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){if(this.download)ctx.downloads.push({name:this.download,text:(ctx.lastBlob&&ctx.lastBlob.parts||[]).join('')});};
  if(opts.size){Object.defineProperty(w.Element.prototype,'clientWidth',{get(){return 800},configurable:true});Object.defineProperty(w.Element.prototype,'clientHeight',{get(){return 600},configurable:true})}
  w.confirm=()=>true;w.prompt=()=>opts.promptValue||'Week-end Ouessant';
  w.fetch=fetchStub;
  w.eval=code=>{const f=b=>new w.Function('__t','with(__t){'+b+'}');try{return f('return ('+code+')')(w.__tp)}catch(e){if(e.name==='SyntaxError')return f(code)(w.__tp);throw e}};
  w.addEventListener('error',e=>errors.push(e.message));
  w.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
 }});
 const w=dom.window,d=w.document;
 const ev=(el,t='input')=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
 const click=sel=>d.querySelector(sel).click();
 return {w,d,ctx,errors,ev,click,sleep,b64,unb,FS:ctx.FS,puts:ctx.puts,
  hash:()=>w.location.hash,
  trips:()=>JSON.parse(unb(ctx.FS['data.json'].content)).trips,
  hashchange:async(ms=300)=>{w.dispatchEvent(new w.Event('hashchange'));await sleep(ms)},
  close:()=>dom.window.close()};
}
