<template>
  <div id="app">
    <header class="app-header">
      <h1>WoWQuote2 Manager</h1>
    </header>

    <div class="layout">
      <Sidebar
        @open-cats="showCatModal = true"
        @export="exportZip"
        @save-media-data="saveMediaData"
      />

      <main class="main">
        <EntryList @add="openAdd" @edit="openEdit" />
        <div class="status-bar" :class="{ error: store.status.error }">
          {{ store.status.msg }}
        </div>
      </main>
    </div>

    <EntryModal
      v-if="entryModal.open"
      :entry="entryModal.entry"
      :entry-idx="entryModal.idx"
      :prefix="entryModal.prefix"
      @close="entryModal.open = false"
    />

    <CategoryModal
      v-if="showCatModal"
      @close="showCatModal = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import JSZip from 'jszip';
import { store } from './store.js';
import { serializeMediaData, serializeMediaLua, patchLocalization } from './lib/serializeLua.js';
import { LOCALIZATION_FILES, LOCALE_FOR_FILE } from './lib/addonFiles.js';
import Sidebar from './components/Sidebar.vue';
import EntryList from './components/EntryList.vue';
import EntryModal from './components/EntryModal.vue';
import CategoryModal from './components/CategoryModal.vue';

const showCatModal = ref(false);
const entryModal = reactive({ open: false, entry: null, idx: null, prefix: 'default' });

onMounted(() => {
  window.addEventListener('message', (e) => {
    if (e.data?.type !== 'theme') return;
    document.documentElement.classList.toggle('light', e.data.theme === 'light');
  });
});

function openAdd() {
  entryModal.entry = null;
  entryModal.idx = null;
  entryModal.open = true;
}

function openEdit(idx) {
  entryModal.entry = store.entries[idx];
  entryModal.idx = idx;
  entryModal.open = true;
}

function saveMediaData() {
  if (!store.entries.length && !store.categories.length) {
    store.setStatus('Nothing to export', true); return;
  }
  download(new Blob([serializeMediaData(store.entries, store.categories)], { type: 'text/plain' }), 'media_data.lua');
  store.setStatus('media_data.lua saved');
}

const GITHUB_RAW = 'https://raw.githubusercontent.com/tehw0lf/WoWQuote2/main/WoWQuote2/';

async function resolveLocalization(filename) {
  if (store.localizationSources[filename]) return store.localizationSources[filename];
  const res = await fetch(GITHUB_RAW + filename);
  if (!res.ok) throw new Error(`Failed to fetch ${filename} from GitHub: ${res.status}`);
  return res.text();
}

async function exportZip(variant) {
  if (!store.entries.length) { store.setStatus('No entries to export', true); return; }

  try {
    store.setStatus('Building ZIP…');
    const zip = new JSZip();

    zip.file('WoWQuote2/Media.lua', serializeMediaLua(store.entries));

    for (const filename of LOCALIZATION_FILES) {
      store.setStatus(`Resolving ${filename}…`);
      const src = await resolveLocalization(filename);
      const lang = LOCALE_FOR_FILE[filename];
      zip.file(`WoWQuote2/${filename}`, patchLocalization(src, lang, store.categories));
    }

    for (const [filename, arraybuf] of Object.entries(store.mp3Blobs)) {
      zip.file(`WoWQuote2/media/${filename}`, arraybuf);
    }

    const today = new Date().toISOString().slice(0, 10);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    download(blob, `WQ2-${variant}-${today}.zip`);
    store.setStatus(`${variant} ZIP exported (${store.entries.length} entries, ${Object.keys(store.mp3Blobs).length} new MP3s)`);
  } catch (err) {
    store.setStatus(`Export failed: ${err.message}`, true);
  }
}

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
</script>
