/* Géométrie pure : distances, projection d’un point sur un tracé, découpage en tronçons. */

export function dm(a,b){
 const R=6371000,r=Math.PI/180,x=(b[0]-a[0])*r,y=(b[1]-a[1])*r;
 const h=Math.sin(x/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(y/2)**2;
 return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function midOf(l){
 if(l.length<2)return l[0];
 let t=0;const c=[0];for(let i=1;i<l.length;i++){t+=dm(l[i-1],l[i]);c.push(t)}
 const h=t/2;let j=1;while(j<l.length-1&&c[j]<h)j++;
 const f=c[j]>c[j-1]?(h-c[j-1])/(c[j]-c[j-1]):0;
 return[l[j-1][0]+(l[j][0]-l[j-1][0])*f,l[j-1][1]+(l[j][1]-l[j-1][1])*f];
}
export function proj(line,p){
 const k=Math.cos(p[0]*Math.PI/180),X=q=>(q[1]-p[1])*k*111320,Y=q=>(q[0]-p[0])*110540;
 let best=1e12,bk=0,cum=0;
 for(let i=1;i<line.length;i++){
  const ax=X(line[i-1]),ay=Y(line[i-1]),dx=X(line[i])-ax,dy=Y(line[i])-ay,L2=dx*dx+dy*dy;
  const t=L2?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L2)):0,d=Math.hypot(ax+t*dx,ay+t*dy);
  if(d<best){best=d;bk=cum+t*Math.sqrt(L2)}
  cum+=Math.sqrt(L2);
 }
 return{d:best,km:bk/1000};
}
export function densify(line,step=1000){
 const o=[line[0]];
 for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],n=Math.max(1,Math.ceil(dm(a,b)/step));for(let k=1;k<=n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}
 return o;
}
export function chunkInfo(line,maxM=6000){
 const L=densify(line),out=[];let cur=[L[0]],acc=0,start=0,tot=0;
 for(let i=1;i<L.length;i++){const d=dm(L[i-1],L[i]);acc+=d;tot+=d;cur.push(L[i]);if(acc>=maxM){out.push({pts:cur,a:start,b:tot});cur=[L[i]];start=tot;acc=0}}
 if(cur.length>1){if(out.length&&tot-start<1500){const l=out[out.length-1];l.pts.push(...cur.slice(1));l.b=tot}else out.push({pts:cur,a:start,b:tot})}
 return out;
}
