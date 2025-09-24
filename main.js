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
  host.addEventListener('scroll', maybeAppend);
  window.addEventListener('resize', maybeAppend);
  sortSel.addEventListener('change', onSortChange);
}
function normalizeItem(it, idx){
  const type=it.hasContent?'real':'filler';
  return { id: it.id ?? String(idx),
    title: it.title||'',
    year: it.year ?? null,
    type, bg: it.bg||'', label: it.label||''
  };
}
function onSortChange(){
  const v=sortSel.value;
  if(v==='alpha'){ order=[...manifest].sort((a,b)=>a.title.localeCompare(b.title)); }
  else if(v==='year'){ order=[...manifest].sort((a,b)=>(a.year??0)-(b.year??0)); }
  else { order=[...manifest]; }
  nextIndex=0; stack.innerHTML=''; appendChunk(24);
}
function fillInitial(){
  stack.innerHTML=''; nextIndex=0; appendChunk(24);
}
function maybeAppend(){
  const {scrollTop, scrollHeight, clientHeight}=host;
  const nearBottom=(scrollTop+clientHeight)/scrollHeight>(1-THRESHOLD);
  if(nearBottom){ appendChunk(CHUNK); }
}
function appendChunk(n){
  for(let i=0;i<n;i++){
    const item=order[nextIndex % order.length];
    stack.appendChild(makeCD(item));
    nextIndex++;
  }
}
function makeCD(item){
  const node=tpl.content.firstElementChild.cloneNode(true);
  node.dataset.type=item.type;
  const bg=node.querySelector('.bg');
  if(item.type==='real' && item.bg){ bg.style.backgroundImage=`url(${item.bg})`; }
  const img=node.querySelector('.label-img');
  if(item.type==='real' && item.label){ img.src=item.label; img.alt=item.title||''; }
  else { img.removeAttribute('src'); }
  // link to proyecto.html
  node.href = `proyecto.html?id=${encodeURIComponent(item.id)}`;
  // fillers shouldn't be clickable to project
  if(item.type==='filler'){ node.removeAttribute('href'); node.style.cursor='default'; }
  return node;
}
async function fetchJSON(url){
  const res=await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`); return res.json();
}
