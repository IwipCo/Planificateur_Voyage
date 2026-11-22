export const title='export GPX d’un jour ou de tout le voyage';
export const options={size:true};
export default async function({w,d,ok,sleep,ctx}){
 await sleep(800);
 const map=w.eval('map'),S=()=>w.eval('D.stages[0]');
 d.querySelector('#badd').click();d.querySelector('#bdraw').click();
 const pt=(a,b)=>map.fire('click',{latlng:w.L.latLng(a,b)});
 pt(48.70,-3.40);pt(48.75,-3.30);pt(48.80,-3.20);
 await sleep(1800);d.querySelector('#bdraw').click();
 for(let i=0;i<30&&!S().elev;i++)await sleep(500);          // le profil se calcule en arrière-plan
 w.eval("D.pois=[{id:'p1',type:'water',name:'Fontaine & lavoir',lat:48.71,lng:-3.39,note:'potable',sid:D.stages[0].id}]");
 d.querySelector('[data-t=recap]').click();
 ok(/Export GPX/.test(d.querySelector('#p-recap').textContent),'section « Export GPX » dans le Récap');
 d.querySelector('#p-recap [data-gpx=all]').click();
 const g1=ctx.downloads.at(-1);
 ok(g1&&g1.name==='proche.gpx','fichier du voyage : '+(g1&&g1.name));
 ok(/<gpx version="1.1"/.test(g1.text)&&/<trk>/.test(g1.text)&&/<trkpt /.test(g1.text),'GPX valide (piste + points)');
 ok(/<wpt /.test(g1.text)&&/Fontaine &amp; lavoir/.test(g1.text),'points d’intérêt inclus et échappés');
 ok(/<ele>/.test(g1.text),'altitudes incluses (profil calculé)');
 const cb=d.querySelector('#gpx-poi');cb.checked=false;cb.dispatchEvent(new w.Event('change',{bubbles:true}));
 const sid=S().id;d.querySelector('#p-recap [data-gpx="'+sid+'"]').click();
 const g2=ctx.downloads.at(-1);
 ok(g2.name==='proche-j1.gpx'&&!/<wpt /.test(g2.text),'export d’un jour sans les points d’intérêt : '+g2.name);
 ok((g2.text.match(/<trk>/g)||[]).length===1,'une seule piste pour un seul jour');
 ok(!d.querySelector('#bsurf')&&!/Revêtement/.test(d.querySelector('#p-recap').textContent),'plus aucune trace du revêtement dans l’interface');
}
