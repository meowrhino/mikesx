const stack = document.getElementById("cdStack");
const host = document.getElementById("scrollHost");
const tpl = document.getElementById("cdTemplate");
const sortSel = document.getElementById("sortSel") || null;
let manifest = [],
  order = [],
  nextIndex = 0;
const CHUNK = 10,
  THRESHOLD = 0.2;

init().catch((err) => {
  console.error("Fallo al inicializar:", err);
  if (stack) {
    stack.innerHTML =
      '<div class="cd-error">No se pudieron cargar los proyectos. Revisa la consola.</div>';
  }
});
async function init() {
  const m = await fetchJSON("data/manifest.json");
  manifest = (m.items || []).map((it, idx) => normalizeItem(it, idx));
  order = [...manifest];
  fillInitial();
  // Desactivamos el scroll infinito ya que no hay elementos de relleno
  // host.addEventListener('scroll', maybeAppend);
  // window.addEventListener('resize', maybeAppend);
  if (sortSel) sortSel.addEventListener("change", onSortChange);
}
function normalizeItem(it, idx) {
  // El manifest simplificado solo tiene proyectos 'reales'
  return {
    id: it.id ?? String(idx),
    title: it.title || "",
    label: it.label || "",
    src: it.src || "",
    artist: it.artist || it.artist || "",
    cover: it.cover || it.coverLink || it.cover_url || "",
  };
}
function onSortChange() {
  const v = sortSel ? sortSel.value : "default";
  if (v === "alpha") {
    order = [...manifest].sort((a, b) => (a.artist || a.title).localeCompare((b.artist || b.title), undefined, { sensitivity: "base" }));
  }
  // Ya no ordenamos por año, solo por defecto o alfabético
  else {
    order = [...manifest];
  }
  nextIndex = 0;
  stack.innerHTML = "";
  appendChunk(order.length); // Solo cargamos los elementos existentes
}
function fillInitial() {
  stack.innerHTML = "";
  nextIndex = 0;
  appendChunk(order.length); // Solo cargamos los elementos existentes
}
// Eliminamos maybeAppend ya que eliminamos el scroll infinito
/*
function maybeAppend(){
  const {scrollTop, scrollHeight, clientHeight}=host;
  const nearBottom=(scrollTop+clientHeight)/scrollHeight>(1-THRESHOLD);
  if(nearBottom){ appendChunk(CHUNK); }
}
*/
function appendChunk(n) {
  // Aseguramos que solo cargamos hasta el final de los elementos
  const limit = Math.min(nextIndex + n, order.length);
  for (let i = nextIndex; i < limit; i++) {
    const item = order[i];
    stack.appendChild(makeCD(item));
    nextIndex++;
  }
}
function makeCD(item) {
  const node =
    tpl && tpl.content
      ? tpl.content.firstElementChild.cloneNode(true)
      : document.createElement("a");
  if (!node.classList.contains("cd")) node.classList.add("cd");
  node.dataset.type = "real";

  // Imagen de la carátula
  const img = node.querySelector ? node.querySelector(".label-img") : null;
  if (img && item.label) {
    img.src = item.label;
    img.alt = (item.artist ? (item.artist + " — ") : "") + (item.title || "");
    img.loading = "lazy";

    // Persist cover and artist as data attributes for future use
    if (item.cover) node.dataset.cover = item.cover;
    if (item.artist) node.dataset.artist = item.artist;

    // Cuando la imagen cargue, usa su tamaño natural para fijar proporción y ancho natural
    const applySize = () => {
      const w = img.naturalWidth || 1400;
      const h = img.naturalHeight || 222;
      // CSS variables que gobiernan el layout (definidas en styles.css)
      node.style.setProperty("--cd-natural-w", w + "px");
      node.style.setProperty("--cd-aspect", `${w} / ${h}`);
      // Además lo aplicamos directo por compatibilidad
      node.style.aspectRatio = `${w} / ${h}`;
    };
    if (img.complete) applySize();
    else img.addEventListener("load", applySize, { once: true });
  } else if (img) {
    // Si no hay label, elimina la imagen para que no quede un placeholder roto
    img.remove();
  }

  // Enlace a proyecto
  node.href = `proyecto.html?id=${encodeURIComponent(item.id)}`;
  node.setAttribute("aria-label", (item.artist ? (item.artist + " — ") : "") + (item.title || item.id || "proyecto"));
  return node;
}
async function fetchJSON(url) {
  const res = await fetch(url).catch((err) => {
    console.error("Fetch error:", err);
    throw err;
  });
  if (!res || !res.ok) {
    throw new Error(`HTTP ${res ? res.status : "—"} ${url}`);
  }
  return res.json();
}
