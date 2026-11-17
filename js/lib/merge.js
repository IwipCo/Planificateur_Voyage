/* Fusion à trois voies : on ne pousse que NOS modifications, appliquées sur la dernière version distante.
   base = dernière version connue du fichier (au chargement ou au dernier enregistrement), local = notre version,
   remote = version actuelle du fichier. Une modification faite ailleurs sur un autre champ, jour, trajet ou voyage n'est jamais écrasée ;
   si le même champ est modifié des deux côtés, notre version l'emporte. */
export const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
export const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
/* valeurs remplacées d'un bloc (tracés, profils, listes de noms…) */
export const ATOMIC=new Set(['points','route','elev','participants','tabsOff','for','homes','poiCov','cover']);
/* listes d'objets portant un « id » : fusionnées élément par élément */
export const IDLISTS=new Set(['trips','stages','transports','messages','chat','checklist','spend','payments','pois']);

export function mergeVal(b,l,r,key){
 if(eq(l,b))return r;                          // rien changé ici : on prend la version distante (modification, ajout ou suppression)
 if(eq(r,b)||eq(l,r))return l;                 // rien changé ailleurs, ou identique : on garde la nôtre
 if(ATOMIC.has(key))return l;                  // bloc modifié des deux côtés : le nôtre l'emporte
 if(IDLISTS.has(key)&&Array.isArray(l)&&Array.isArray(r))return mergeIdList(Array.isArray(b)?b:[],l,r,key);
 if(isObj(l)&&isObj(r)){                       // objet modifié des deux côtés : champ par champ, sur place
  const bb=isObj(b)?b:{};
  for(const k of new Set([...Object.keys(l),...Object.keys(r),...Object.keys(bb)])){
   const v=mergeVal(bb[k],l[k],r[k],k);
   if(v===undefined)delete l[k];else l[k]=v;
  }
  return l;
 }
 return l;                                     // même champ modifié des deux côtés : notre version l'emporte
}
const item=(b,l,r)=>mergeVal(b,l,r,'item');
function mergeIdList(b,l,r,key){
 const ids=a=>a.map(x=>x&&x.id),bm=new Map(b.map(x=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x])),out=[];
 if(eq(ids(l),ids(b))){
  // aucun ajout, suppression ni réordonnancement ici : l'ordre distant fait foi
  for(const rx of r){const lx=lm.get(rx.id);out.push(lx?item(bm.get(rx.id),lx,rx):rx)}
  for(const lx of l)if(!rm.has(lx.id)&&!eq(lx,bm.get(lx.id)))out.push(lx);     // supprimé ailleurs mais modifié ici : conservé
 }else{
  // structure modifiée ici : notre ordre fait foi
  for(const lx of l){
   const bx=bm.get(lx.id),rx=rm.get(lx.id);
   if(!bx)out.push(rx?item(undefined,lx,rx):lx);                               // ajouté ici
   else if(!rx){if(!eq(lx,bx))out.push(lx)}                                    // supprimé ailleurs : gardé seulement si modifié ici
   else out.push(item(bx,lx,rx));
  }
  for(const rx of r)if(!lm.has(rx.id)&&!bm.has(rx.id))out.push(rx);            // ajouté ailleurs
 }
 if(key==='messages'||key==='chat')out.sort((x,y)=>(x.ts||0)-(y.ts||0));
 return out;
}
