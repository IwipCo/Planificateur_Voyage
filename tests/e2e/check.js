/* Mini-outil d'assertions : compte les réussites et les échecs. */
export const results={ok:0,ko:0,fails:[]};
export function makeOk(scope){
 return (cond,msg)=>{
  if(cond){results.ok++;if(process.env.VERBOSE)console.log('  OK  '+msg)}
  else{results.ko++;results.fails.push(scope+' — '+msg);console.log('  KO  '+msg)}
 };
}
