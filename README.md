# Documentación del Repositorio mikesx

## Introducción

El repositorio `mikesx` contiene el código fuente de una galería de proyectos visuales, presentada como una colección de CDs. La interfaz principal muestra una pila de CDs que se pueden explorar, y al hacer clic en uno de ellos, se accede a una página de detalle con más información e imágenes del proyecto. El diseño es minimalista y se centra en la presentación visual de los trabajos.

## Estructura del Proyecto

Sigue la receta de [meowrhino/JAMstack](https://github.com/meowrhino/JAMstack) desde el
2026-10-18. Para Mike: [GUIA.md](GUIA.md). Traspaso: [TRASPASO.md](TRASPASO.md). Si el build
falla: [CLAUDE.md](CLAUDE.md).

```
data/site.json          el nombre, el dominio y "lists": los CDs de la home, en orden
projects/<id>/          un CD: project.json (title, artist, year, description, label, cover, photos…) + img/
schema/                 qué campos lleva cada JSON (VS Code, el build y la vista previa)
index.html, proyecto.html   las plantillas, y la vista previa con Live Server
build/build.mjs         → dist/: la home y /<id>/ con sus meta y su contenido dentro
main.js, project.js     la pila de CDs y la página de un CD (módulos)
js/house.js             la forma de la casa → la de antes (los items del manifest y su detalle)
js/carga.js             lee los JSON (en la vista previa, los revisa con schema/); projectUrl()
js/validar.js           el JSON Schema sin dependencias (de JAMstack)
fonts/                  Michroma y Saira en woff2 (sin Google Fonts)
```

- **El build** (`npm ci && node build/build.mjs`) escribe en `dist/` la home y una página por CD
  (`/<id>/`) con title, description, og:image (1200×630, **sharp**) y canonical, que antes no
  tenían, y el contenido ya en el HTML. `proyecto.html?id=` sigue funcionando.
- **Vista previa**: Live Server sobre la carpeta. Sin `data-built` en `<html>`, `carga.js` revisa
  los JSON y enseña los errores en pantalla, y los CDs enlazan a `proyecto.html?id=`.
- **Publicar, una en cada copia**: la nuestra, `.github/workflows/deploy.yml` a GitHub Pages (solo
  en `meowrhino`; si falla, un issue). La de Mike, Workers Builds (`wrangler.jsonc`).

#### Parámetros ajustables de `main.js`

- `BATCH_SIZE` (por defecto `8`): Tamaño del lote que se añade tanto en el relleno inicial como en el scroll infinito.
- `THRESHOLD` (por defecto `0.2`): Porción final del scroll a partir de la cual se dispara la carga de un nuevo lote. `0.2` significa que al cruzar el 80% del contenido visible se carga otro bloque.
- `FILL_FACTOR` (por defecto `1.2`): Factor de relleno mínimo respecto al alto del viewport. `1.2` ≈ 120 % del alto de la ventana (120 dvh).

### Archivos de Datos (JSON)

- **`manifest.json`**: Es el archivo principal de datos. Contiene un array de objetos, donde cada objeto representa un proyecto (un CD en la colección). Cada objeto tiene la siguiente estructura:
    - `id`: Identificador único del proyecto.
    - `title`: Título del proyecto.
    - `artist`: Artista o autor del proyecto.
    - `label`: Ruta a la imagen lateral del CD.
    - `cover`: Ruta a la imagen de la portada del CD.
    - `src`: Ruta al archivo JSON de detalle del proyecto.
- **Directorio `data/json`**: Contiene los archivos JSON individuales para cada proyecto. Cada archivo JSON tiene la siguiente estructura:
    - `title`: Título del proyecto.
    - `artist`: Artista o autor del proyecto.
    - `year`: Año de realización del proyecto.
    - `description`: Descripción detallada del proyecto.
    - `images`: Un array de rutas a las imágenes de la galería del proyecto.
- **`data/about.json`**: Contiene el contenido de la página "Acerca de" en formato JSON.

### Archivos de Estilos (CSS)

- **`styles.css`**: Contiene todos los estilos de la aplicación. Define el diseño de la pila de CDs, la página de detalle del proyecto, la tipografía, los colores y la capacidad de respuesta para diferentes tamaños de pantalla.

### Directorio de Imágenes

- **`data/img`**: Contiene todas las imágenes del proyecto, organizadas en subdirectorios con el nombre de cada proyecto.

## Flujo de la Aplicación

1.  **Carga de la página principal (`index.html`)**: El navegador carga `index.html` y su script asociado, `main.js`.
2.  **Inicialización de `main.js`**: El script `main.js` se ejecuta y realiza las siguientes acciones:
    -   Hace una petición `fetch` para obtener `manifest.json`.
    -   **Baraja la lista de proyectos** y **renderiza todos** una sola vez en orden aleatorio.
    -   **Comprueba si existe overflow** y, si no, **rellena** el contenido **hasta ~`FILL_FACTOR` × 100% del alto de la ventana** (por defecto 120 dvh) añadiendo tandas de tamaño `BATCH_SIZE`.
    -   **Activa el scroll infinito**: añade un *event listener* que, al acercarse al final (umbral `THRESHOLD`), inyecta un nuevo lote.
3.  **Interacción del usuario**: El usuario se desplaza por la lista de CDs. Al alcanzar el umbral configurado, `main.js` añade **otro lote** de elementos (por defecto 8). El sistema re‑baraja el *pool* cuando se recorre completo para evitar patrones repetitivos.
4.  **Selección de un proyecto**: El usuario hace clic en un CD. El enlace del CD redirige a `proyecto.html` con el `id` del proyecto en la URL (por ejemplo, `proyecto.html?id=777`).
5.  **Carga de la página de detalle (`proyecto.html`)**: El navegador carga `proyecto.html` y su script asociado, `project.js`.
6.  **Inicialización de `project.js`**: El script `project.js` se ejecuta y realiza las siguientes acciones:
    -   Lee el `id` del proyecto de la URL.
    -   Hace una petición `fetch` para obtener `manifest.json` y encuentra el proyecto con el `id` correspondiente.
    -   Con la información del proyecto del manifiesto, obtiene la ruta al archivo JSON de detalle (el campo `src`).
    -   Hace una nueva petición `fetch` para obtener el archivo JSON de detalle del proyecto.
    -   Una vez cargados los datos del proyecto, `project.js` actualiza dinámicamente el contenido de la página: el título, el artista, la descripción y la galería de imágenes.
7.  **Navegación a "Acerca de"**: Si el usuario hace clic en el enlace "About", se carga la página `about.html` y su script `about.js`, que a su vez carga y muestra el contenido de `data/about.json`.

## Diferencias respecto a versiones anteriores

- Se **elimina el menú de ordenación** (y la lógica asociada) en la página principal.
- Se abandona el cálculo de “chunk inicial” dependiente de la altura de un CD. En su lugar, se **renderiza una pasada completa en aleatorio** y se **rellena hasta un mínimo de ~`FILL_FACTOR` × 100% del viewport**.
- El **scroll infinito** se simplifica con tres constantes ajustables: `BATCH_SIZE`, `THRESHOLD` y `FILL_FACTOR`.

## Conclusión

El proyecto `mikesx` es una aplicación web sencilla pero bien estructurada para mostrar una colección de proyectos visuales. Utiliza un enfoque de carga de datos dinámica a través de archivos JSON, lo que facilita la adición de nuevos proyectos sin necesidad de modificar el código HTML o JavaScript. La separación de la lógica en diferentes archivos JavaScript (`main.js`, `project.js`, `about.js`) y la centralización de los datos en archivos JSON hacen que el código sea modular y fácil de mantener.
