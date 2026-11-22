/* Exécute tous les scénarios e2e (un fichier = un scénario, une application neuve à chaque fois). */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {makeApp} from './harness.js';
import {results,makeOk} from './check.js';
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'scenarios');
const only=process.argv[2];
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&(!only||f.includes(only))).sort();
for(const f of files){
 const mod=await import(pathToFileURL(path.join(dir,f)));
 const name=f.replace('.js','');console.log('\n▶ '+name+(mod.title?' — '+mod.title:''));
 const t0=Date.now();
 const app=await makeApp(mod.options||{});
 const ok=makeOk(name);
 try{await mod.default({...app,ok})}catch(e){results.ko++;results.fails.push(name+' — exception : '+e.message);console.log('  KO  exception : '+(e.stack||e.message).split('\n').slice(0,4).join('\n'))}
 if(app.errors.length&&!mod.allowErrors){results.ko++;results.fails.push(name+' — erreurs JavaScript : '+app.errors.join(' | '));console.log('  KO  erreurs JavaScript dans la page : '+app.errors.join(' | '))}
 app.close();
 console.log('  ('+((Date.now()-t0)/1000).toFixed(1)+' s)');
}
console.log('\n══ Résultat : '+results.ok+' réussis, '+results.ko+' échecs ══');
if(results.ko){console.log(results.fails.map(x=>' • '+x).join('\n'));process.exit(1)}
process.exit(0);
