export const title='popups fermées par clic extérieur, grille de 3 colonnes';
export const options={};
export default async function(app){
 const {w,d,ok,sleep,ev,FS,puts,ctx,unb,b64}=app;const qs=ctx.qs,urls=ctx.urls;

  await sleep(800);
  const outside=dl=>{dl.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));dl.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
  // --- grille 3 colonnes ---
  d.querySelector('#bpoi').click();
  const L=[...d.querySelectorAll('#pd-cats .pcat')];
  ok(L.length===12,'12 types en grille : '+L.map(l=>l.textContent.trim().replace(/\s+/g,' ')).join(' | '));
  ok(/repeat\(3,1fr\)/.test(d.querySelector('style').textContent),'grille de 3 colonnes (CSS)');
  ok(L.every(l=>l.querySelector('.pe')&&l.querySelector('.pl')),'icône au-dessus du libellé');
  const cb=d.querySelector('[data-pc=hotel]');cb.checked=false;cb.dispatchEvent(new w.Event('change',{bubbles:true}));
  ok(!cb.closest('.pcat').classList.contains('on'),'case décochée -> carte grisée');
  // --- clic dehors : POI manager ---
  const pd=d.querySelector('#pdlg');ok(pd.hasAttribute('open'),'popup points ouverte');
  pd.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
  d.querySelector('#pd-count').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  ok(pd.hasAttribute('open'),'clic à l’intérieur : reste ouverte');
  outside(pd);ok(!pd.hasAttribute('open'),'clic en dehors : fermée');
  // --- clic dehors : réglages (sans enregistrer) ---
  const tokBefore=w.eval('C.token');
  d.querySelector('#bset').click();
  const dl=d.querySelector('#dlg');ok(dl.hasAttribute('open'),'réglages ouverts');
  d.querySelector('#c-token').value='AUTRE';outside(dl);
  ok(!dl.hasAttribute('open')&&w.eval('C.token')===tokBefore,'réglages : fermés sans enregistrer le token modifié');
  // --- glisser depuis l'intérieur vers l'extérieur : ne ferme pas ---
  d.querySelector('#bset').click();
  d.querySelector('#c-token').dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
  dl.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  ok(dl.hasAttribute('open'),'sélection de texte débordant dehors : ne ferme pas');
  outside(dl);
  // --- accueil : popup du voyage ---
  d.querySelector('#bback').click();await sleep(100);w.dispatchEvent(new w.Event('hashchange'));await sleep(300);
  d.querySelector('[data-edit=A]').click();
  const td=d.querySelector('#tdlg');ok(td.hasAttribute('open'),'popup du voyage ouverte');
  d.querySelector('#td-name').value='NOM MODIFIÉ';outside(td);
  ok(!td.hasAttribute('open')&&w.eval("ALL.trips.find(t=>t.id==='A').title")==='Loin','popup voyage : fermée, rien enregistré');
  // --- popup POI (création) ---
  d.querySelector('[data-edit=B]').click();outside(d.querySelector('#tdlg'));
 

}
