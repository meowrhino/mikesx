# Traspaso: la versión nueva a la copia de Mike

Mike ya tiene su copia, `miguelricoengel/mikeysx`, que publica `mikebros.com`
con GitHub Pages (*legacy*); los cambios son nuestros (hasta el 2026-07-28). Cada
proyecto es `proyecto.html?id=<id>`, sin meta propias: las páginas llevan las meta, pero el contenido lo pinta el
JS y Google lo ve vacío. Podemos escribir en su repo (no somos admin).

**Su copia y la nuestra eran iguales** el 2026-10-18 (la nuestra, con un arreglo más). Lo que haya cambiado desde
entonces hay que traerlo antes.

La nueva la publica su Cloudflare con Workers Builds; el DNS de
`mikebros.com` ya está en Cloudflare. En su copia la Action de publicar no
corre (lleva `if: github.repository_owner == 'meowrhino'`) y el build, al no
estar en GitHub, publica en la raíz con el `url` de `site.json`.

Tiempo: unos 30 minutos, y un rato con él: **cambia cómo edita** (de `manifest.json` +
`data/json/` + `data/img/` a una carpeta por proyecto con todo dentro). Hablarlo antes.

## Antes

- [ ] `main` de meowrhino al día y sin cambios a medias (`git status` limpio).
- [ ] ¿Ha tocado algo Mike en su copia desde el 2026-10-18 (cuando se trajo su contenido; su último commit era del 2026-07-30)?
      `gh api repos/miguelricoengel/mikeysx/commits --jq '.[0:3][].commit.message'`. Si sí, pasar
      sus cambios aquí antes de seguir (`manifest.json` + `data/json/<id>.json` → `projects/<id>/project.json`; el orden, a `data/site.json` → `lists`).
- [ ] El DNS de `mikebros.com` está en Cloudflare (`*.ns.cloudflare.com`). Mirar **en
      qué cuenta**: tiene que ser la de Mike.

## 1. La versión nueva, en una rama de su copia

Las dos copias no comparten historia. Se sube a una rama aparte para que su web
siga igual mientras se prepara Cloudflare:

- [ ] `git push https://github.com/miguelricoengel/mikeysx.git main:receta`

## 2. Cloudflare (con Mike, en su cuenta)

- [ ] **Workers & Pages → Create → Import a repository** → `miguelricoengel/mikeysx`, rama de
      producción **`receta`**. Lo demás lo lee de `wrangler.jsonc` (instala sharp con
      `npm install`, build `node build/build.mjs`, sale `dist/`).
- [ ] Mirar la web en su `*.workers.dev`: la home (la pila de CDs) y un CD (`/anela/`).
- [ ] **Settings → Domains & Routes → Add → Custom domain**: `mikebros.com` (y `www`).
      Cloudflare cambia los registros que apuntaban a GitHub Pages.

## 3. `main` pasa a ser la versión nueva

- [ ] Guardar la de antes: `git push https://github.com/miguelricoengel/mikeysx.git <sha-de-su-main>:refs/heads/antes`.
- [ ] `git push --force-with-lease=main:<sha-de-su-main> https://github.com/miguelricoengel/mikeysx.git main`
      (desde nuestra `main`).
- [ ] En Cloudflare, rama de producción → **`main`**. Borrar la rama `receta`.
- [ ] Mike, en su repo: Settings → Pages → **Unpublish site** (ya no sirve nada).

## 4. Que nos deje entrar en Cloudflare

- [ ] Manage account → Members → nos invita. Ahí se ve el error entero de un build que falla.

## 5. Comprobar en su dominio

- [ ] La home, un CD (`/anela/`), el about (`/mikesx/`) y un enlace viejo (`/proyecto.html?id=anela`).
- [ ] `view-source:` de un CD: el título, el texto y las imágenes están en el HTML, y sus meta (antes, ninguna).
- [ ] `view-source:`: `canonical` y `og:url` con `mikebros.com`, y **sin**
      `<meta name="robots" content="noindex">`.
- [ ] `/robots.txt` dice `Allow` y `/sitemap.xml` tiene las direcciones de su dominio.
- [ ] Compartir un proyecto por WhatsApp: sale su foto (la og).

## 6. Search Console, con su cuenta de Google

- [ ] Dar de alta el dominio (el registro TXT, en el DNS de Cloudflare) y enviar `sitemap.xml`.

## 7. Mike en su ordenador

Con él delante, siguiendo [GUIA.md](GUIA.md) ("La primera vegada"):

- [ ] Clona **su** repositorio, no el de meowrhino (si ya lo tenía, **Sincronizar**: la
      estructura cambia entera).
- [ ] Live Server: **Go Live** y ve la vista previa.
- [ ] Un cambio pequeño (una coma en el about), Confirmar → Sincronizar, y la bolita verde.

## 8. Al acabar

- [ ] Fila de mikesx en `JAMstack/inventario.md` con las dos direcciones (github.io y su dominio).
- [ ] La copia de meowrhino sigue en github.io con `noindex`: no compite en Google.
