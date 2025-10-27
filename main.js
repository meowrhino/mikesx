"use strict";

/**
 * MIKESX — main.js (refactor v2)
 * -------------------------------------------------------------
 * - Carga manifest.json y pinta la pila de CDs.
 * - Sin scroll infinito: renderiza todos los items existentes.
 * - Orden: por defecto o alfabético (por artista o título).
 */

/* ===================== DOM refs ============================= */
const stack = document.getElementById("cdStack");
const host = document.getElementById("scrollHost");
const tpl = document.getElementById("cdTemplate");
const sortSel = document.getElementById("sortSel") || null;

/* ===================== Estado =============================== */
/** @type {Array<CDItem>} */
let manifest = [];
/** @type {Array<CDItem>} */
let order = [];
let nextIndex = 0; // índice de pintado incremental

/* ===================== Constantes =========================== */
let CHUNK = 10; // tamaño de carga actual (se recalcula al iniciar)
const NEXT_CHUNK = 8; // tandas siguientes
const THRESHOLD = 0.3; // dispara la siguiente tanda cuando queda ~30% para el final (carga antes)

/* ===================== Bootstrap ============================ */
init().catch((err) => {
  console.error("Fallo al inicializar:", err);
  if (stack) {
    stack.innerHTML =
      '<div class="cd-error">No se pudieron cargar los proyectos. Revisa la consola.</div>';
  }
});

/**
 * Punto de entrada: trae manifest y renderiza.
 */
async function init() {
  const m = await fetchJSON("manifest.json");
  manifest = (m.items || []).map((it, idx) => normalizeItem(it, idx));
  order = [...manifest];

  // Calcular chunk inicial según alto del viewport y altura real de un CD
  CHUNK = computeInitialChunk();

  renderAll();

  if (sortSel) sortSel.addEventListener("change", onSortChange);
}

/* ===================== Normalización ======================== */
/**
 * Normaliza un item del manifest a nuestra estructura interna.
 * @param {Partial<CDItem>} it
 * @param {number} idx
 * @returns {CDItem}
 */
function normalizeItem(it, idx) {
  return {
    id: it.id ?? String(idx),
    title: it.title || "",
    label: it.label || "",
    src: it.src || "",
    artist: it.artist || "",
    cover: it.cover || it.coverLink || it.cover_url || "",
  };
}

/* ===================== Ordenación =========================== */
function onSortChange() {
  const v = sortSel ? sortSel.value : "default";
  applySort(v);
  renderAll();
}

/**
 * Aplica el criterio de ordenación sobre "order".
 * @param {"default"|"alpha"} mode
 */
function applySort(mode) {
  if (mode === "alpha") {
    order = [...manifest].sort((a, b) =>
      (a.artist || a.title).localeCompare(b.artist || b.title, undefined, {
        sensitivity: "base",
      })
    );
  } else {
    order = [...manifest];
  }
}

/* ===================== Render =============================== */
/**
 * Reinicia el contenedor y pinta todos los elementos (sin infinito).
 */
function renderAll() {
  if (!stack) return;
  // Evita duplicar listeners si re-renderizamos (p.ej., al cambiar orden)
  disableInfiniteScroll();

  stack.innerHTML = "";
  nextIndex = 0;

  // 1) Cargar primer bloque
  appendChunk(CHUNK);

  // 2) Si aún no hay overflow (pantallas altas / pocos ítems), seguir cargando
  requestAnimationFrame(() => ensureOverflow());

  // 3) Activar listeners para continuar cargando al hacer scroll / resize
  enableInfiniteScroll();
}

/**
 * Añade N elementos respetando el límite de "order".
 * @param {number} n
 */
function appendChunk(n) {
  const limit = Math.min(nextIndex + n, order.length);
  for (let i = nextIndex; i < limit; i++) {
    const item = order[i];
    stack.appendChild(makeCD(item));
    nextIndex++;
  }
}

function ensureOverflow() {
  if (!host) return;
  // Cargar hasta que exista scroll o se agoten los elementos
  let safety = 0; // evita bucles infinitos en casos raros
  while (nextIndex < order.length && host.scrollHeight <= host.clientHeight && safety < 100) {
    appendChunk(NEXT_CHUNK);
    safety++;
  }
}

function maybeAppend() {
  if (!host) return;
  const { scrollTop, scrollHeight, clientHeight } = host;
  const nearBottom = (scrollTop + clientHeight) / scrollHeight > (1 - THRESHOLD);
  if (nearBottom) appendChunk(NEXT_CHUNK);
}

let _infBound = false;
function enableInfiniteScroll() {
  if (!host || _infBound) return;
  host.addEventListener("scroll", maybeAppend);
  window.addEventListener("resize", onResizeReflow);
  _infBound = true;
  // Comprobación inmediata por si ya estamos cerca del fondo tras el primer render
  maybeAppend();
}

function disableInfiniteScroll() {
  if (!host || !_infBound) return;
  host.removeEventListener("scroll", maybeAppend);
  window.removeEventListener("resize", onResizeReflow);
  _infBound = false;
}

function onResizeReflow() {
  // Si tras un resize ya no hay overflow (p.ej., orientación), forzamos cargar más
  ensureOverflow();
}

/**
 * Genera el nodo de un CD listo para insertar en el DOM.
 * @param {CDItem} item
 * @returns {HTMLAnchorElement}
 */
function makeCD(item) {
  const node =
    tpl && tpl.content
      ? tpl.content.firstElementChild.cloneNode(true)
      : document.createElement("a");

  if (!node.classList.contains("cd")) node.classList.add("cd");
  node.dataset.type = "real";

  // Imagen de la carátula lateral
  const img = node.querySelector ? node.querySelector(".label-img") : null;
  if (img && item.label) {
    img.src = item.label;
    img.alt = (item.artist ? item.artist + " — " : "") + (item.title || "");
    img.loading = "lazy";

    // Persist cover and artist as data attributes para futuros usos
    if (item.cover) node.dataset.cover = item.cover;
    if (item.artist) node.dataset.artist = item.artist;
  } else if (img) {
    // Si no hay label, retiramos la img para evitar placeholder roto
    img.remove();
  }

  // Enlace a la página de proyecto
  node.href = `proyecto.html?id=${encodeURIComponent(item.id)}`;
  node.setAttribute(
    "aria-label",
    (item.artist ? item.artist + " — " : "") +
      (item.title || item.id || "proyecto")
  );

  return node;
}

/* ===================== Helper =============================== */
function computeInitialChunk(){
  if (!host || order.length === 0) return 10;
  // Medimos la altura real de un CD con un nodo temporal oculto
  const tmp = makeCD(order[0]);
  tmp.style.visibility = "hidden";
  tmp.style.position = "absolute";
  tmp.style.pointerEvents = "none";
  stack.appendChild(tmp);
  const h = Math.max(1, tmp.getBoundingClientRect().height || 140);
  stack.removeChild(tmp);

  const rows = Math.ceil(host.clientHeight / h);
  // Un poco más de margen para cubrir barras de navegador en móvil
  const initial = Math.min(order.length, Math.max(8, rows + 2));
  return initial;
}

/* ===================== Utilidades =========================== */
/**
 * Fetch JSON sencillo con manejo de errores.
 * @template T
 * @param {string} url
 * @returns {Promise<T>}
 */
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

/* ===================== Tipos JSDoc ========================== */
/**
 * @typedef {Object} CDItem
 * @property {string} id
 * @property {string} title
 * @property {string} label   // ruta de la imagen lateral
 * @property {string} src     // no usado actualmente
 * @property {string} artist
 * @property {string} cover   // posible portada
 */
