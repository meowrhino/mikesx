# Guía de la web

> **Regla de oro: solo se tocan `data/site.json` y `projects/`.** Lo demás es el código.

## Qué hay

```
data/site.json             el nombre, el dominio y los CDs de la home, en orden
projects/<nombre>/         un CD, una carpeta:
  project.json               su título, artista, año, texto y qué imágenes usa
  img/                       sus imágenes: el lomo (_lateral), la portada (_cover) y las de la galería
```

El **nombre de la carpeta** es también el de la dirección: `projects/anela/` →
`mikebros.com/anela/`. Letras sin acentos, números y guiones, sin espacios. Mejor no cambiarlo
una vez publicado: rompería los enlaces que ya circulan.

## La primera vez: preparar VS Code

Solo se hace una vez.

1. En VS Code: **Archivo → Nueva ventana** y, en la bienvenida, **Clonar repositorio Git…** →
   **Clonar desde GitHub**. Entra con tu cuenta, elige tu repositorio y una carpeta.
2. Al abrirla, VS Code propone instalar **Live Server** (abajo a la derecha): **Instalar**.
3. Abajo a la derecha sale **Go Live**: es la vista previa.

**VS Code te ayuda con los campos**: si pasas el ratón por encima de uno (`"title"`, `"photos"`…)
te dice qué es, y si escribes uno mal o pones algo que no toca, lo subraya en rojo. Para ver
qué campos puedes poner, dentro de las llaves pulsa **Ctrl+Espacio**. Lo sabe por la primera
línea de cada JSON (`"$schema": …`): **no la borres**.

## Añadir un CD, paso a paso

1. **Copia una carpeta** de `projects/` y ponle el nombre nuevo: `projects/anela/` →
   `projects/nuevo/`. Borra sus imágenes.
2. **Las imágenes**: pásalas por [imgToWeb](https://meowrhino.github.io/imgToWeb/), **en Chrome o
   Firefox** (Safari no sabe hacer `.webp`), y ponlas en `img/`: el lomo (`nuevo_lateral.webp`),
   la portada (`nuevo_cover.webp`) y las de la galería (`nuevo_1.webp`, `nuevo_2.webp`…).
3. **Los textos**: abre `project.json` y cambia lo que toque (los campos, abajo).
4. **En la home**: en `data/site.json`, añade el nombre de la carpeta a la lista, en el sitio
   donde quieras que salga. El about (`mikesx`) va siempre el primero.
5. **Go Live** para verlo, y después **Subir los cambios**.

**Esconder un CD** (que tenga su página para mandarla, pero que no salga en la home ni en
Google): en la lista, en vez de `"nombre"`, pon `{ "project": "nombre", "visible": false }`. Una
carpeta que no está en la lista no se publica (como `noTengoBateria`, ahora).

## Los campos de un CD (`project.json`)

| campo | qué hace |
|---|---|
| `title` | el título |
| `artist` | el artista, o lo que va debajo del título |
| `year` | el año, sin comillas: `2025` |
| `description` | el texto. Un salto de línea (`\n`) es una línea nueva |
| `label` | el lomo del CD en la home: `"nuevo_lateral.webp"` |
| `cover` | la portada: `"nuevo_cover.webp"`. Es la imagen al compartir el enlace |
| `photos` | las imágenes de la galería, en orden: `["nuevo_cover.webp", "nuevo_1.webp"]` |
| `instagram` | *opcional*: un enlace a instagram |

## Verlo antes de subirlo

**Go Live** abajo a la derecha de VS Code. Se abre la web en el navegador y se refresca sola
cada vez que guardas. Si hay algo que no se publicaría (una coma, un campo mal escrito), sale
en pantalla, y dice dónde.

## Subir los cambios

1. Pestaña **Control de código fuente** (las tres bolitas unidas, a la izquierda).
2. Escribe qué has hecho (`cd nuevo: nuevo`) y **Confirmar** (*Commit*). Si pregunta si quieres
   añadir todos los cambios: **Sí**.
3. **Sincronizar cambios** (*Sync*).
4. En un par de minutos está en la web. En GitHub, al lado del último cambio sale una bolita:
   amarilla es que se está publicando, verde que ya está, roja que algo no cuadra.

**Antes de empezar a tocar**, dale también a **Sincronizar**, para bajar lo que haya cambiado.

## Si sale en rojo

La web no se rompe: se queda como estaba hasta que se arregla. Pincha la bolita roja, luego
**Details**, y lee el último mensaje, que dice el fichero y qué pasa:

- **"no es un JSON válido, línea 12"** → casi siempre **una coma**: que falta entre dos cosas,
  o que sobra después de la última. O unas comillas sin cerrar.
- **"\"titulo\" no es un campo de aquí (¿mal escrito?). Los que hay: title, artist…"** → un
  campo mal escrito: cópialo de la lista que sale en el mensaje.
- **"no encuentro projects/nuevo/img/nuevo_3.webp"** → el nombre de la imagen no es igual
  (mayúsculas, espacios, la extensión) o no se ha subido.
- **"\"lists\" dice \"nuevo\", y no hay ningún projects/nuevo/project.json"** → el nombre de la
  lista y el de la carpeta no son iguales.
