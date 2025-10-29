"use strict";

/**
 * MIKESX — main.js (random-first + fill-to-120% + simple infinite scroll)
 * -----------------------------------------------------------------------
 * - Carga manifest.json y pinta TODOS los CDs una vez, en orden aleatorio.
 * - Si no hay suficiente contenido, rellena hasta cubrir ~FILL_FACTOR * 100% del viewport
 *   añadiendo lotes (con posibles repeticiones) tomados de un pool circular re-barajable.
 * - Scroll infinito simple: cuando el usuario se acerca al final, añade otro lote.
 * - Eliminado el menú de ordenación y cualquier lógica asociada.
 */

/* ===================== DOM refs ============================= */
const stack = document.getElementById("cdStack");
const host  = document.getElementById("scrollHost");
const tpl   = document.getElementById("cdTemplate");

/* ===================== Config (tweakables) ================== */
/** Tamaño del lote para rellenar / infinito (puedes cambiarlo) */
const BATCH_SIZE  = 8;
/** Umbral “cerca del final”. 0.2 = al pasar el 80% del scroll */
const THRESHOLD   = 0.2;
/** Factor de relleno mínimo del alto de ventana (1.2 = 120% de dvh) */
let FILL_FACTOR   = 1.2; // <-- variable expuesta para que la cambiéis fácil

/* ===================== Estado =============================== */
/** @type {Array<CDItem>} */
let manifest = [];
/** Pool barajado (se recorre en bucle para crear lotes extra) */
let pool = [];
/** Puntero dentro del pool circular */
let poolPtr = 0;
/** Control de listeners para no duplicarlos accidentalmente */
let _scrollBound = false;

/* ===================== Bootstrap ============================ */
init().catch((err) => {
  console.error("Fallo al inicializar:", err);
  if (stack) {
    stack.innerHTML =
      '<div class="cd-error">No se pudieron cargar los proyectos. Revisa la consola.</div>';
  }
});

/**
 * Punto de entrada.
 * 1) Carga manifest y lo normaliza.
 * 2) Pinta TODOS los ítems 1 vez en orden aleatorio.
 * 3) Rellena hasta ~FILL_FACTOR * 100% del viewport si no hay overflow.
 * 4) Activa scroll infinito simple.
 */
async function init() {
  const m = await fetchJSON("manifest.json");
  manifest = (m.items || []).map((it, idx) => normalizeItem(it, idx));

  // 1) Crear un orden aleatorio inicial
  const randomOnce = shuffle([...manifest]);

  // 2) Render: primera pasada (todos una vez, aleatorio)
  renderInitial(randomOnce);

  // 3) Preparar pool circular para rellenos (arranca barajado)
  pool = shuffle([...manifest]);
  poolPtr = 0;

  // 4) Asegurar overflow mínimo (~FILL_FACTOR * viewport)
  ensureMinFill();

  // 5) Activar scroll infinito
  enableInfiniteScroll();
}

/* ===================== Normalización ======================== */
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

/* ===================== Render =============================== */
/**
 * Pinta una pasada completa (todos los ítems) en el orden dado.
 */
function renderInitial(list) {
  if (!stack) return;
  stack.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const item of list) {
    frag.appendChild(makeCD(item));
  }
  stack.appendChild(frag);
}

/**
 * Asegura que el contenedor tenga al menos ~FILL_FACTOR * 100% del alto de ventana.
 * Rellena en tandas de BATCH_SIZE (con posibles repeticiones) hasta alcanzar la meta
 * o hasta que el sistema detecte overflow suficiente.
 */
function ensureMinFill() {
  if (!host) return;
  const targetPx = Math.ceil(window.innerHeight * FILL_FACTOR);

  let safety = 0; // evita bucles raros
  while (host.scrollHeight < targetPx && safety < 200) {
    appendBatch(BATCH_SIZE);
    safety++;
  }
}

/**
 * Añade un lote de N ítems al final, sacándolos del pool circular.
 * Si se agota el pool, se re-baraja para evitar patrones repetitivos fijos.
 */
function appendBatch(n) {
  if (!stack || pool.length === 0) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    if (poolPtr >= pool.length) {
      pool = shuffle(pool);
      poolPtr = 0;
    }
    const item = pool[poolPtr++];
    frag.appendChild(makeCD(item));
  }
  stack.appendChild(frag);
}

/**
 * Listener de scroll simplificado: al pasar el (1 - THRESHOLD) del scroll,
 * carga otra tanda.
 */
function onHostScroll() {
  if (!host) return;
  const { scrollTop, scrollHeight, clientHeight } = host;
  const nearBottom = (scrollTop + clientHeight) / scrollHeight >= (1 - THRESHOLD);
  if (nearBottom) appendBatch(BATCH_SIZE);
}

/**
 * En mobile/orientación, si el viewport crece y ya no hay overflow suficiente,
 * volvemos a completar hasta ~FILL_FACTOR * viewport.
 */
function onResize() {
  ensureMinFill();
}

function enableInfiniteScroll() {
  if (!host || _scrollBound) return;
  host.addEventListener("scroll", onHostScroll, { passive: true });
  window.addEventListener("resize", onResize);
  _scrollBound = true;

  // Llamada inicial por si al render ya estamos “abajo” en pantallas muy altas
  onHostScroll();
}

function disableInfiniteScroll() {
  if (!host || !_scrollBound) return;
  host.removeEventListener("scroll", onHostScroll);
  window.removeEventListener("resize", onResize);
  _scrollBound = false;
}

/* ===================== Vistas =============================== */
function makeCD(item) {
  const node =
    tpl && tpl.content
      ? tpl.content.firstElementChild.cloneNode(true)
      : document.createElement("a");

  if (!node.classList.contains("cd")) node.classList.add("cd");
  node.dataset.type = "real";

  // Imagen lateral
  const img = node.querySelector ? node.querySelector(".label-img") : null;
  if (img && item.label) {
    img.src = item.label;
    img.alt = (item.artist ? item.artist + " — " : "") + (item.title || "");
    img.loading = "lazy";
    if (item.cover)  node.dataset.cover  = item.cover;
    if (item.artist) node.dataset.artist = item.artist;
  } else if (img) {
    img.remove();
  }

  // Enlace a la página de proyecto
  node.href = `proyecto.html?id=${encodeURIComponent(item.id)}`;
  node.setAttribute(
    "aria-label",
    (item.artist ? item.artist + " — " : "") + (item.title || item.id || "proyecto")
  );

  return node;
}

/* ===================== Utilidades =========================== */
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

function shuffle(arr) {
  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ===================== Tipos JSDoc ========================== */
/**
 * @typedef {Object} CDItem
 * @property {string} id
 * @property {string} title
 * @property {string} label
 * @property {string} src
 * @property {string} artist
 * @property {string} cover
 */
