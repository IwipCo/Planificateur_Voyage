/* Charge les modules TELS QUELS (ES modules natifs, sans bundle) : vérifie l'ordre d'évaluation, les cycles d'import
   et l'absence d'erreur « avant initialisation » qu'un navigateur rencontrerait. */
import test from 'node:test';import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
test('chargement natif des modules ES (js/main.js) dans un DOM simulé',async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').replace(/<script[\s\S]*?<\/script>/g,'');
 const dom=new JSDOM(html,{url:'https://u.github.io/voyage/',pretendToBeVisual:true,runScripts:'outside-only'});
 const w=dom.window;
 w.eval(fs.readFileSync(path.join(ROOT,'vendor/leaflet/leaflet.js'),'utf8'));
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 const trips=[{id:'B',title:'Proche',start:'2099-01-05',end:'2099-01-09',participants:['A'],stages:[],messages:[],transports:[]}];
 const fetchStub=async u=>String(u).includes('data.json')?{ok:true,status:200,json:async()=>({version:2,trips}),text:async()=>''}:{ok:false,status:404,json:async()=>({}),text:async()=>''};
 const set={window:w,document:w.document,localStorage:w.localStorage,location:w.location,history:w.history,L:w.L,fetch:fetchStub,
  addEventListener:w.addEventListener.bind(w),removeEventListener:w.removeEventListener.bind(w),Image:w.Image,FileReader:w.FileReader,confirm:()=>true,prompt:()=>''};
 for(const[k,v]of Object.entries(set))Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
 const errors=[],ids=[],realSI=globalThis.setInterval;
 globalThis.setInterval=(f,ms)=>{const id=realSI(f,ms);ids.push(id);return id};   // l’appli actualise toutes les 60 s : on les arrête en fin de test
 process.on('unhandledRejection',e=>errors.push(e));
 await import(pathToFileURL(path.join(ROOT,'js/main.js')).href);       // ← lève ReferenceError si l'ordre d'évaluation est mauvais
 await new Promise(r=>setTimeout(r,800));
 assert.equal(errors.length,0,String(errors[0]&&errors[0].stack));
 assert.ok(w.document.querySelector('#title').value==='Proche'||w.document.querySelector('#home').hidden===false,'application démarrée');
 assert.ok(w.document.querySelector('#map .leaflet-pane'),'carte Leaflet montée');
 assert.ok(w.document.querySelectorAll('.tabs button').length>=6);
 ids.forEach(clearInterval);w.close();
});
