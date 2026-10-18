// El contenido a la manera del estudio (JAMstack) → el de antes
//
// El contenido vive así: data/site.json ("lists": qué CDs salen y en qué orden;
// uno oculto, { "project": "x", "visible": false }) y cada proyecto en
// projects/<id>/project.json con sus imágenes en img/. Campos en inglés.
//
// main.js y project.js siguen trabajando con la forma de antes (los items del
// manifest.json con rutas enteras, y el detalle de data/json/<id>.json); estas
// funciones pasan de una a otra. Las usan el navegador (carga.js) y el build:
// sin DOM ni disco.

// "lists" → [{ id, visible }], en orden
export const entriesOf = (site) => Object.values(site.lists || {}).flatMap((l) => l.projects || [])
  .map((e) => (e && typeof e === 'object' ? { id: e.project, visible: e.visible !== false } : { id: e, visible: true }));

const img = (id, f) => (f ? `projects/${id}/img/${f}` : '');

// el item del manifest y su detalle, juntos (project.js ya los juntaba)
export function itemOld(id, p) {
  return {
    id,
    title: p.title,
    artist: p.artist || '',
    label: img(id, p.label),
    cover: img(id, p.cover),
    ...(p.instagram ? { instagram: p.instagram } : {}),
    ...(p.about ? { isAbout: true, email: p.email } : {}),
    ...(p.year !== undefined ? { year: p.year } : {}),
    ...(p.description ? { description: p.description } : {}),
    images: (p.photos || []).map((f) => img(id, f)),
    ...(p.html ? { html: p.html } : {}),
  };
}
