const stack=document.getElementById('cdStack');
const host=document.getElementById('scrollHost');
const tpl=document.getElementById('cdTemplate');
const sortSel=document.getElementById('sortSel');
let manifest=[], order=[], nextIndex=0;
const CHUNK=10, THRESHOLD=0.2;

init();
async function init(){
  const m=await fetchJSON('data/manifest.json');
  manifest=(m.items||[]).map((it,idx)=>normalizeItem(it, idx));
  order=[...manifest];
  fillInitial();
  // Desactivamos el scroll infinito ya que no hay elementos de relleno
  // host.addEventListener('scroll', maybeAppend);
  // window.addEventListener('resize', maybeAppend);
  sortSel.addEventListener('change', onSortChange);
}
function normalizeItem(it, idx){
  // El manifest simplificado solo tiene proyectos 'reales'
  return { id: it.id ?? String(idx),
    title: it.title||'',
    label: it.label||'',
    src: it.src||''
  };
}
function onSortChange(){
  const v=sortSel.value;
  if(v==='alpha'){ order=[...manifest].sort((a,b)=>a.title.localeCompare(b.title)); }
  // Ya no ordenamos por año, solo por defecto o alfabético
  else { order=[...manifest]; }
  nextIndex=0; stack.innerHTML=''; appendChunk(order.length); // Solo cargamos los elementos existentes
}
function fillInitial(){
  stack.innerHTML=''; nextIndex=0; appendChunk(order.length); // Solo cargamos los elementos existentes
}
// Eliminamos maybeAppend ya que eliminamos el scroll infinito
/*
function maybeAppend(){
  const {scrollTop, scrollHeight, clientHeight}=host;
  const nearBottom=(scrollTop+clientHeight)/scrollHeight>(1-THRESHOLD);
  if(nearBottom){ appendChunk(CHUNK); }
}
*/
function appendChunk(n){
  // Aseguramos que solo cargamos hasta el final de los elementos
  const limit = Math.min(nextIndex + n, order.length);
  for(let i=nextIndex; i<limit; i++){
    const item=order[i];
    stack.appendChild(makeCD(item));
    nextIndex++;
  }
}
function makeCD(item){
  const node=tpl.content.firstElementChild.cloneNode(true);
  // Eliminamos el dataset.type y la lógica de bg, ya que no hay 'filler' ni 'bg' en el manifest
  const img=node.querySelector('.label-img');
  if(item.label){ img.src=item.label; img.alt=item.title||''; }
  else { img.removeAttribute('src'); }
  // link to proyecto.html
  node.href = `proyecto.html?id=${encodeURIComponent(item.id)}`;
  return node;
}
async function fetchJSON(url){
  const res=await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`); return res.json();
}
