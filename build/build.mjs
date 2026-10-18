/* ============================================================
   build.mjs — data/site.json + projects/ + index.html y proyecto.html
   (las plantillas) → dist/, la web tal cual se publica.
       node build/build.mjs

   La home y una página por CD (/<id>/), cada una con su title,
   description, og:image y canonical (antes no tenían ninguna) y el
   contenido ya escrito (los CDs enlazados; el título, el artista, el año,
   el texto y las imágenes), para que Google y WhatsApp lo lean sin JS. Al
   cargar, el JS de siempre vuelve a pintar lo mismo. Antes cada proyecto
   era proyecto.html?id=<id>, que sigue funcionando.

   Si algo está mal (una coma, un campo mal escrito, una imagen que no está)
   para y dice qué, y no se publica nada: la web se queda como estaba.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entriesOf, itemOld } from '../js/house.js';
import { leerJSON, validar } from '../js/validar.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo se ha publicado nada: la web sigue como estaba.\n`); process.exit(1); };

/* ---------- leer y revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no encuentro ${rel}`);
  try { return leerJSON(readFileSync(at(rel), 'utf8'), rel); } catch (e) { fail(e.message); }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const errors = validar(site, schema('site'), 'data/site.json');
const entries = errors.length ? [] : entriesOf(site);
const projects = {};
for (const { id } of entries) {
  const rel = `projects/${id}/project.json`;
  if (projects[id]) { errors.push(`data/site.json: "${id}" está dos veces en "lists"`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${id}", y no hay ningún ${rel}`); continue; }
  const p = projects[id] = read(rel);
  const before = errors.length;
  errors.push(...validar(p, schema('project'), rel));
  if (errors.length > before) continue;
  for (const f of [p.label, p.cover, ...(p.photos || [])]) if (!existsSync(at('projects', id, 'img', f))) errors.push(`${rel}: no encuentro projects/${id}/img/${f}`);
}
if (errors.length) fail(errors.join('\n✗ '));
// las carpetas que no salen en "lists" no se publican: se avisa, por si es un olvido
for (const d of readdirSync(at('projects'))) {
  if (existsSync(at('projects', d, 'project.json')) && !projects[d]) console.warn(`⚠ projects/${d} no está en data/site.json → lists: no se publica`);
}

/* Dónde se publica, según dónde se construye (JAMstack, patrones §5): en la
   Action de GitHub (nuestra copia), meowrhino.github.io/<repo>/ y sin
   indexar; en cualquier otro sitio (Cloudflare, en la copia de Mike), la
   raíz con el dominio de site.json → "url", y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const BASE = github ? `/${repo}` : '';
const SITE = github ? `https://${owner}.github.io${BASE}` : String(site.url || '').replace(/\/+$/, '');
const INDEX = !github && !!site.url;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const cut = (s) => (s.length <= 160 ? s : s.slice(0, 157).trimEnd() + '…');
const items = entries.map(({ id, visible }) => ({ ...itemOld(id, projects[id]), visible }));
const about = items.find((it) => it.isAbout);

/* ---------- la imagen al compartir, con sharp ---------- */

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.warn(`⚠ sin sharp (${e.code || e.message}): al compartir sale la portada tal cual. Se arregla con: npm ci`);
}
const ogs = new Map();
for (const it of items) {
  if (!sharp) break;
  const cached = at('.cache', 'og', `${it.id}.jpg`);
  try {
    if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(at(it.cover)).mtimeMs)) {
      mkdirSync(dirname(cached), { recursive: true });
      await sharp(at(it.cover)).resize(1104, 534, { fit: 'contain', background: '#000000' })
        .extend({ top: 48, bottom: 48, left: 48, right: 48, background: '#000000' })
        .flatten({ background: '#000000' }).jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
    }
    ogs.set(it.id, cached);
  } catch (e) {
    console.warn(`⚠ ${it.cover}: sharp no la puede leer (${e.message}); al compartir sale tal cual`);
  }
}
const ogUrl = (it) => (ogs.has(it.id) ? `${SITE}/og/${it.id}.jpg` : `${SITE}/${enc(it.cover)}`);

/* ---------- las páginas ---------- */

function swap(html, find, replace, file) {
  if (!find.test(html)) fail(`no encuentro ${find} en ${file}: el build lo necesita para escribir las páginas.`);
  return html.replace(find, replace);
}
const metaTags = ({ title, desc, url, image, robots }) => `
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="${robots || (INDEX ? 'index,follow' : 'noindex')}" />
  <link rel="canonical" href="${esc(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(site.title)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta name="twitter:card" content="summary_large_image" />`;

function homePage() {
  const file = 'index.html';
  let html = readFileSync(at(file), 'utf8');
  html = swap(html, /<html lang="[^"]*">/, (m) => m.replace('>', ' data-built>'), file);
  html = swap(html, /(<title>[^<]*<\/title>)/, `$1${metaTags({ title: site.title, desc: cut(plain(about?.description) || site.title), url: `${SITE}/`, image: about ? ogUrl(about) : '' })}`, file);
  // los CDs, para quien no ejecuta JS (main.js vacía la pila y la vuelve a pintar)
  const cds = items.filter((it) => it.visible).map((it) => `<a class="cd" href="${encodeURIComponent(it.id)}/"><img class="label-img" src="${enc(it.label)}" alt="${esc(`${it.artist ? `${it.artist} — ` : ''}${it.title}`)}" loading="lazy" /></a>`).join('\n        ');
  return swap(html, /<section id="cdStack" class="cd-stack"><\/section>/, `<section id="cdStack" class="cd-stack">\n        ${cds}\n      </section>`, file);
}

function projectPage(it) {
  const file = 'proyecto.html';
  const url = `${SITE}/${encodeURIComponent(it.id)}/`;
  let html = readFileSync(at(file), 'utf8');
  html = swap(html, /<html lang="[^"]*">/, (m) => m.replace('>', ' data-built>'), file);
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(String(it.title).toUpperCase())}</title>${metaTags({
    title: `${it.title}${it.artist ? ` — ${it.artist}` : ''}`, desc: cut(plain(it.description) || `${it.title}, ${it.artist}`), url, image: ogUrl(it),
    robots: it.visible ? null : 'noindex',
  })}\n  <base href="../" />\n  <script>window.__ID__ = ${JSON.stringify(it.id).replace(/</g, '\\u003c')};</script>`, file);
  // el contenido, como lo pinta project.js (que lo vuelve a pintar encima)
  html = swap(html, /(<div id="imageGallery" class="image-gallery">)[\s\S]*?(<\/div>)/,
    `$1${it.images.map((src) => `<img class="gallery-image" src="${enc(src)}" alt="${esc(it.title)}" loading="lazy" />`).join('')}$2`, file);
  html = swap(html, /<h1 id="pTitle">[^<]*<\/h1>/, `<h1 id="pTitle">${esc(it.title)}</h1>`, file);
  html = swap(html, /<p id="pArtist" class="muted"><\/p>/, `<p id="pArtist" class="muted">${esc(it.artist)}</p>`, file);
  html = swap(html, /<p id="pYear" class="muted"><\/p>/, `<p id="pYear" class="muted">${esc(it.year ?? '')}</p>`, file);
  return swap(html, /<p id="pDesc"><\/p>/, `<p id="pDesc">${String(it.description || '').replace(/\n/g, '<br>')}</p>`, file);
}

const notFound = () => `<!doctype html>
<html lang="es" data-built><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" /><title>${esc(site.title)}</title>
<link rel="stylesheet" href="${BASE}/fonts/fonts.css" /><link rel="stylesheet" href="${BASE}/styles.css" /></head>
<body><main class="viewport" style="display:grid;place-items:center;min-height:100dvh"><p>esta página no existe · <a href="${BASE}/">volver</a></p></main></body></html>
`;

/* ---------- escribir dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['styles.css', 'css', 'fonts', 'js', 'main.js', 'project.js', 'data', 'projects']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
// proyecto.html?id= sigue valiendo (enlaces viejos), ya construida
writeFileSync(join(OUT, 'proyecto.html'), readFileSync(at('proyecto.html'), 'utf8').replace(/<html lang="([^"]*)">/, '<html lang="$1" data-built>'));
writeFileSync(join(OUT, 'index.html'), homePage());
writeFileSync(join(OUT, '404.html'), notFound());
mkdirSync(join(OUT, 'og'), { recursive: true });
for (const [id, cached] of ogs) cpSync(cached, join(OUT, 'og', `${id}.jpg`));
for (const it of items) {
  mkdirSync(join(OUT, it.id), { recursive: true });
  writeFileSync(join(OUT, it.id, 'index.html'), projectPage(it));
}
const urls = [`${SITE}/`, ...items.filter((it) => it.visible).map((it) => `${SITE}/${encodeURIComponent(it.id)}/`)];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: home y ${items.length} CDs${INDEX ? ` · se indexa (${SITE})` : ' · sin indexar'}`);
