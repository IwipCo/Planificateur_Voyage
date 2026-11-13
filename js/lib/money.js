/* Calcul des soldes et des remboursements (pur). */

export function settle(E,participants,payments){
 const bal={};participants.forEach(p=>bal[p]={paid:0,owed:0,adj:0});let un=0;
 E.forEach(e=>{if(!e.payer||!bal[e.payer]){un+=e.amt;return}bal[e.payer].paid+=e.amt;e.who.forEach(w=>{if(bal[w])bal[w].owed+=e.amt/e.who.length})});
 payments.forEach(p=>{if(bal[p.from])bal[p.from].adj+=+p.amt;if(bal[p.to])bal[p.to].adj-=+p.amt});
 const cr=[],db=[],r2=x=>Math.round(x*100)/100;
 Object.entries(bal).forEach(([p,b])=>{b.net=r2(b.paid-b.owed+b.adj);if(b.net>0)cr.push([p,b.net]);else if(b.net<0)db.push([p,-b.net])});
 cr.sort((a,b)=>b[1]-a[1]);db.sort((a,b)=>b[1]-a[1]);
 const tr=[];let i=0,j=0;
 while(i<db.length&&j<cr.length){const x=r2(Math.min(db[i][1],cr[j][1]));tr.push({from:db[i][0],to:cr[j][0],amt:x});db[i][1]=r2(db[i][1]-x);cr[j][1]=r2(cr[j][1]-x);if(db[i][1]<=0)i++;if(cr[j][1]<=0)j++}
 return{bal,tr,un};
}
