<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h3>Load Files</h3>
      <p class="hint">Drop <code>media_data.lua</code> to load your entries. <code>Localization.*.lua</code> files are fetched from GitHub automatically — only upload them if you have existing categories to preserve.</p>
      <div
        class="drop-zone"
        :class="{ dragover: draggingLua }"
        @click="$refs.luaInput.click()"
        @dragover.prevent="draggingLua = true"
        @dragleave="draggingLua = false"
        @drop.prevent="onLuaDrop"
      >Drop .lua / .zip here or click</div>
      <input ref="luaInput" type="file" accept=".lua,.zip" multiple style="display:none" @change="onLuaChange">
      <div v-if="loadedLocalizations.length" class="loaded-list">
        <span v-for="f in loadedLocalizations" :key="f" class="tag">{{ f }}</span>
      </div>
    </div>

    <div class="sidebar-section">
      <h3>Add Sound(s)</h3>
      <div class="form-row">
        <label>Prefix</label>
        <input v-model="prefix" type="text" placeholder="e.g. murfy">
      </div>
      <div
        class="drop-zone"
        :class="{ dragover: draggingMp3 }"
        @click="$refs.mp3Input.click()"
        @dragover.prevent="draggingMp3 = true"
        @dragleave="draggingMp3 = false"
        @drop.prevent="onMp3Drop"
      >Drop MP3(s) here or click</div>
      <input ref="mp3Input" type="file" accept=".mp3" multiple style="display:none" @change="onMp3Change">
    </div>

    <div class="sidebar-section">
      <h3>Categories</h3>
      <button class="btn" @click="$emit('open-cats')">Manage Categories</button>
    </div>

    <div class="sidebar-section">
      <h3>Export</h3>
      <div class="btn-row">
        <button class="btn primary" @click="$emit('export', 'TBC')">TBC</button>
        <button class="btn primary" @click="$emit('export', 'Vanilla')">Vanilla</button>
        <button class="btn primary" @click="$emit('export', 'WOTLK')">WotLK</button>
      </div>
      <button class="btn" style="margin-top:8px; width:100%" @click="$emit('save-media-data')">
        Save media_data.lua
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import JSZip from 'jszip';
import { store } from '../store.js';
import { parseLua } from '../lib/parseLua.js';
import { LOCALIZATION_FILES } from '../lib/addonFiles.js';

defineEmits(['open-cats', 'export', 'save-media-data']);

const prefix = ref('default');
const draggingLua = ref(false);
const draggingMp3 = ref(false);

const loadedLocalizations = computed(() => Object.keys(store.localizationSources));

function onLuaDrop(e) {
  draggingLua.value = false;
  handleLoadFiles(Array.from(e.dataTransfer.files));
}
function onLuaChange(e) {
  handleLoadFiles(Array.from(e.target.files));
  e.target.value = '';
}

async function handleLoadFiles(files) {
  for (const file of files) {
    if (file.name.endsWith('.zip')) {
      await loadZip(file);
    } else if (file.name === 'media_data.lua') {
      await loadMediaData(file);
    } else if (LOCALIZATION_FILES.includes(file.name)) {
      await loadLocalization(file);
    } else if (file.name.endsWith('.lua')) {
      store.setStatus(`Skipped ${file.name} — not media_data.lua or a known Localization file`, true);
    }
  }
}

async function loadZip(file) {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    let loaded = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      const name = path.split('/').pop();
      if (name === 'media_data.lua') {
        const text = await entry.async('string');
        applyMediaData(text, name);
        loaded.push(name);
      } else if (LOCALIZATION_FILES.includes(name)) {
        store.localizationSources[name] = await entry.async('string');
        loaded.push(name);
      }
    }
    if (!loaded.length) store.setStatus(`No recognizable files found in ${file.name}`, true);
    else store.setStatus(`Loaded from ${file.name}: ${loaded.join(', ')}`);
  } catch (err) {
    store.setStatus(`ZIP error: ${err.message}`, true);
  }
}

async function loadMediaData(file) {
  try {
    applyMediaData(await file.text(), file.name);
  } catch (err) {
    store.setStatus('Parse error: ' + err.message, true);
  }
}

function applyMediaData(text, name) {
  const parsed = parseLua(text);
  store.entries = parsed.entries;
  store.categories = parsed.categories;
  store.mp3Blobs = {};
  store.setStatus(`Loaded ${parsed.entries.length} entries, ${parsed.categories.length} categories from ${name}`);
}

async function loadLocalization(file) {
  store.localizationSources[file.name] = await file.text();
  store.setStatus(`Loaded ${file.name}`);
}

function onMp3Drop(e) {
  draggingMp3.value = false;
  handleMp3Files(Array.from(e.dataTransfer.files));
}
function onMp3Change(e) {
  handleMp3Files(Array.from(e.target.files));
}

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function extractPrefix(filename) {
  // test_001.mp3 → test, murfy_042.mp3 → murfy
  const m = filename.match(/^([a-z0-9]+)_\d+\.mp3$/i);
  return m ? m[1].toLowerCase() : null;
}

function resolveCategory(p) {
  // Find existing category whose en name matches prefix (case-insensitive)
  const idx = store.categories.findIndex(
    c => c.en.toLowerCase() === p.toLowerCase()
  );
  if (idx !== -1) return idx + 1;
  // Not found — create a new category
  store.categories.push({ en: p.charAt(0).toUpperCase() + p.slice(1) });
  return store.categories.length;
}

async function handleMp3Files(files) {
  for (const file of files) {
    // Auto-detect prefix from filename, fall back to the prefix input
    const detected = extractPrefix(file.name);
    const p = detected ?? (prefix.value.trim() || 'default');

    // Update the prefix input to reflect what was detected
    prefix.value = p;

    const buf = await file.arrayBuffer();
    const id = store.nextIdForPrefix(p);
    const filename = store.idToFilename(id);
    store.mp3Blobs[filename] = buf;
    let len = 0;
    try {
      const decoded = await getAudioCtx().decodeAudioData(buf.slice(0));
      len = Math.round(decoded.duration);
    } catch {}
    const cat = resolveCategory(p);
    store.entries.push({ id, file: filename, len, msg: file.name.replace(/\.mp3$/i, ''), cat });
  }
  store.setStatus(`Added ${files.length} MP3(s) with prefix "${prefix.value}"`);
}
</script>
