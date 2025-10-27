init();
async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const m = await (await fetch("manifest.json")).json();
  const items = m.items || [];
  let item = items.find((it) => String(it.id ?? "") === String(id));
  
  if (!item) {
    // Si no se encuentra, redirigir a la home o usar el primer elemento
    window.location.href = 'index.html';
    return;
  }
  
  // Cargar el JSON de detalle del proyecto
  let data = {};
  if (item.src) {
    try {
      data = await (await fetch(item.src)).json();
    } catch (e) {
      console.warn(e);
      // Si falla la carga del JSON de detalle, usamos los datos del manifest como fallback
      data = item;
    }
  } else {
    data = item;
  }

// Stage + fondo blur con la 1ª imagen de la galería (fallback: data.bg)
const stage = document.getElementById("projectStage");

// Normalizamos la lista de imágenes (quitamos falsy/strings vacíos)
const images = (Array.isArray(data.images) ? data.images : [])
  .map(s => typeof s === "string" ? s.trim() : s)
  .filter(Boolean);

const coverSrc = images[0] || data.bg || null;
if (coverSrc) {
  stage.style.setProperty('--stage-bg', `url("${coverSrc}")`);
}

document.getElementById("pTitle").textContent = data.title || "Sin título";
document.getElementById("pArtist").textContent = data.artist || "";
document.getElementById("pYear").textContent = data.year || "";
document.getElementById("pDesc").textContent = data.description || "";

// Lógica para la galería de imágenes con scroll lateral
const gallery = document.getElementById("imageGallery");

if (images.length > 0) {
  images.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${data.title || 'Proyecto'} - Imagen ${index + 1}`;
    img.classList.add('gallery-image');
    if (index === 0) {
      img.classList.add('cover-image'); // Para centrar la primera imagen
    }
    gallery.appendChild(img);
  });
} else {
  // Ocultamos el contenedor si no hay imágenes
  gallery.style.display = "none";
}
}
