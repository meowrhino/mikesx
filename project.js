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

  // Set background of stage (ahora el bg está en el JSON de detalle)
  const stage = document.getElementById("projectStage");
  if (data.bg) {
    stage.style.background = `center / cover no-repeat url(${data.bg})`;
  }
  document.getElementById("pTitle").textContent =
    data.title || "Sin título";
  document.getElementById("pArtist").textContent = data.artist || "";
  document.getElementById("pYear").textContent = data.year || "";
  document.getElementById("pDesc").textContent = data.description || "";

  // Lógica para la galería de imágenes con scroll lateral
  const gallery = document.getElementById("imageGallery");
  const images = data.images || [];

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
  }
}
