/* Détecte les identifiants non définis (oubli d'import, faute de frappe) dans tous les modules — ce que le bundler ne signale pas. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as acorn from 'acorn';import * as escope from 'eslint-scope';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
const OK=new Set(('document window localStorage location history navigator fetch L Math JSON Object Array Set Map Date Promise setTimeout clearTimeout setInterval clearInterval AbortController FileReader Image Number String Boolean parseInt parseFloat '+
 'encodeURIComponent decodeURIComponent escape unescape atob btoa confirm prompt structuredClone Infinity NaN isNaN Float64Array Int32Array Blob console URL Error SyntaxError RegExp Event addEventListener globalThis undefined').split(' '));
const walk=(d,a=[])=>{for(const f of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const p=path.join(d,f.name);f.isDirectory()?walk(p,a):f.name.endsWith('.js')&&a.push(p)}return a};
test('aucun identifiant non défini dans js/',()=>{
 const bad=[];
 for(const f of walk('js')){
  const ast=acorn.parse(fs.readFileSync(path.join(ROOT,f),'utf8'),{ecmaVersion:'latest',sourceType:'module',ranges:true,locations:true});
  const sm=escope.analyze(ast,{ecmaVersion:2022,sourceType:'module'});
  for(const r of sm.globalScope.through)if(!OK.has(r.identifier.name))bad.push(`${f}:${r.identifier.loc.start.line} ${r.identifier.name}`);
 }
 assert.deepEqual(bad,[],'identifiants inconnus :\n'+bad.join('\n'));
});
test('aucune variable importée n’est réaffectée (les imports ES sont en lecture seule)',()=>{
 const bad=[];
 for(const f of walk('js')){
  const ast=acorn.parse(fs.readFileSync(path.join(ROOT,f),'utf8'),{ecmaVersion:'latest',sourceType:'module',ranges:true,locations:true});
  const sm=escope.analyze(ast,{ecmaVersion:2022,sourceType:'module'});
  const mod=sm.scopes.find(s=>s.type==='module');
  for(const v of mod.variables)if(v.defs.some(d=>d.type==='ImportBinding'))for(const r of v.references)if(r.isWrite())bad.push(`${f}:${r.identifier.loc.start.line} ${v.name}`);
 }
 assert.deepEqual(bad,[]);
});
