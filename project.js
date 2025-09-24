init();
async function init(){
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const m=await (await fetch('data/manifest.json')).json();
  const items=(m.items||[]);
  let item = items.find(it => String(it.id??'')===String(id));
  if(!item){ item = items.find(it=>it.hasContent) || items[0]; }
  // Set background of stage
  const stage=document.getElementById('projectStage');
  if(item.bg){ stage.style.background=`center / cover no-repeat url(${item.bg})`; }
  // Load its detailed JSON if provided, else synthesize from manifest
  let data = item;
  if(item.src){
    try{ data = await (await fetch(item.src)).json(); } catch(e){ console.warn(e); }
  }
  document.getElementById('pTitle').textContent = data.title || item.title || 'Sin título';
  document.getElementById('pArtist').textContent = data.artist || '';
  document.getElementById('pYear').textContent = data.year || '';
  document.getElementById('pDesc').textContent = data.description || '';
  const cover = document.getElementById('coverImg');
  cover.src = data.cover || item.cover || item.label || '';
  cover.alt = data.title || '';
}
