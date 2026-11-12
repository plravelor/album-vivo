import {setupEditor} from './editor.js';
import {loadPublishedAlbum, startAR} from './viewer.js';
import {setStatus} from './common.js';

const tabWatch = document.getElementById('tab-watch');
const tabCreate = document.getElementById('tab-create');
const watchSection = document.getElementById('watch-section');
const createSection = document.getElementById('create-section');
const publishedState = document.getElementById('published-state');
const publishedSummary = document.getElementById('published-summary');
const watchButton = document.getElementById('watch-published');
let published = null;

function selectTab(tab) {
  const isWatch = tab === 'watch';
  watchSection.hidden = !isWatch;
  createSection.hidden = isWatch;
  tabWatch.classList.toggle('active', isWatch);
  tabCreate.classList.toggle('active', !isWatch);
  tabWatch.setAttribute('aria-selected', isWatch ? 'true':'false');
  tabCreate.setAttribute('aria-selected', isWatch ? 'false':'true');
}

tabWatch.addEventListener('click', () => selectTab('watch'));
tabCreate.addEventListener('click', () => selectTab('create'));
document.getElementById('open-create').addEventListener('click', () => selectTab('create'));
watchButton.addEventListener('click', () => { if (published) startAR(published); });
setupEditor(startAR);

async function load() {
  try {
    published = await loadPublishedAlbum();
    if (!published) {
      setStatus(publishedState, 'Todavía no hay un álbum publicado. Entra a «Crear álbum», elige tus fotos y videos y descarga el paquete.');
      return;
    }
    setStatus(publishedState, `${published.manifest.title} — ${published.items.length} fotografía(s) interactivas listas.`);
    for (const item of published.items) {
      const card = document.createElement('div');
      card.className = 'preview-item';
      const image = document.createElement('img');
      image.src = item.photoURL;
      image.alt = item.title;
      image.loading = 'lazy';
      const caption = document.createElement('p');
      caption.textContent = item.title;
      card.append(image, caption);
      publishedSummary.appendChild(card);
    }
    publishedSummary.hidden = false;
    watchButton.disabled = false;
  } catch (err) {
    console.error(err);
    setStatus(publishedState, `Error al cargar álbum publicado: ${err.message}`, true);
  }
}
load();
