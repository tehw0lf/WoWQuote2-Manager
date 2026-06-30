<template>
  <div class="entry-list-wrapper">
    <div class="toolbar">
      <button class="btn primary" @click="$emit('add')">+ Add Entry</button>
      <label>Search:</label>
      <input v-model="search" type="text" placeholder="msg or id…" class="search-input">
      <label>Category:</label>
      <select v-model.number="catFilter" class="cat-filter">
        <option :value="0">All</option>
        <option v-for="(cat, i) in store.categories" :key="i" :value="i + 1">
          {{ cat.en }}
        </option>
      </select>
      <span v-if="!manualOrder || search || catFilter" class="muted reorder-hint">Clear sort/filter to enable drag reordering</span>
      <span v-else class="muted reorder-hint">
        Only newly uploaded entries (highlighted) can be reordered — existing entries keep a fixed
        position because in-game <code>(~i~)</code> chat triggers reference it directly.
      </span>
      <span class="count-label">{{ visible.length }} / {{ store.entries.length }} entries</span>
    </div>

    <div class="entry-list">
      <table>
        <thead>
          <tr>
            <th v-if="reorderable" class="drag-col"></th>
            <th @click="setSortFromManual('id')">ID {{ sortIndicator('id') }}</th>
            <th @click="setSortFromManual('msg')">Message {{ sortIndicator('msg') }}</th>
            <th @click="setSortFromManual('file')">File {{ sortIndicator('file') }}</th>
            <th @click="setSortFromManual('len')">Len {{ sortIndicator('len') }}</th>
            <th @click="setSortFromManual('cat')">Cat {{ sortIndicator('cat') }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(e, visIdx) in visible"
            :key="e.id"
            :class="{ 'drag-over': dragOverId === e.id, 'new-entry': isNew(e) }"
            :draggable="reorderable && isNew(e)"
            @dragstart="onDragStart(e)"
            @dragover="onDragOver($event, e)"
            @dragleave="onDragLeave(e)"
            @drop="onDrop($event, e)"
            @dragend="onDragEnd"
          >
            <td v-if="reorderable" class="drag-col" :title="isNew(e) ? 'Drag to reorder' : 'Fixed position — referenced by (~i~) chat triggers'">{{ isNew(e) ? '⠿' : '🔒' }}</td>
            <td class="id-col">{{ e.id }}</td>
            <td>{{ e.msg }}</td>
            <td class="file-col">{{ e.file }}</td>
            <td class="len-col">{{ e.len }}s</td>
            <td class="cat-col">{{ store.catName(e.cat) }}</td>
            <td class="actions">
              <button
                class="btn small"
                :class="{ playing: playing === e.file }"
                :disabled="!store.mp3Blobs[e.file]"
                :title="store.mp3Blobs[e.file] ? 'Play' : 'Not loaded'"
                @click="play(e.file)"
              >▶</button>
              <button
                class="btn small"
                :disabled="playing !== e.file"
                title="Stop"
                @click="stop()"
              >■</button>
              <button class="btn small" @click="$emit('edit', store.entries.indexOf(e))">Edit</button>
              <button class="btn small danger" @click="deleteEntry(store.entries.indexOf(e))">Del</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { store } from '../store.js';

defineEmits(['add', 'edit']);

const search = ref('');
const catFilter = ref(0);
const sortCol = ref('id');
const sortAsc = ref(true);

function setSort(col) {
  if (sortCol.value === col) sortAsc.value = !sortAsc.value;
  else { sortCol.value = col; sortAsc.value = true; }
}

function sortIndicator(col) {
  if (sortCol.value !== col) return '';
  return sortAsc.value ? '▲' : '▼';
}

const manualOrder = ref(true);

function setSortFromManual(col) {
  manualOrder.value = false;
  setSort(col);
}

const visible = computed(() => {
  const q = search.value.toLowerCase();
  let list = store.entries.filter(e => {
    if (catFilter.value && e.cat !== catFilter.value) return false;
    if (q && !e.msg.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
    return true;
  });
  if (!manualOrder.value) {
    list = [...list].sort((a, b) => {
      let va = a[sortCol.value], vb = b[sortCol.value];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortAsc.value ? -1 : 1;
      if (va > vb) return sortAsc.value ? 1 : -1;
      return 0;
    });
  }
  return list;
});

// Reordering only makes sense when the visible list isn't filtered/sorted away
// from store.entries order, otherwise a drag would silently scramble the store.
const reorderable = computed(() =>
  manualOrder.value && !search.value && !catFilter.value
);

// WoWQuote2's chat trigger "(~i~)" addresses entries by their array index, not
// their id (see WQ_GetMedia/WQ_Play in WoWQuote2.lua). Moving an *existing*
// entry would change that index for anyone still on an older Media.lua, making
// old triggers play the wrong sound. Only entries whose MP3 was uploaded in
// this session (i.e. never distributed under their current index) may move,
// and only among themselves, so existing indices stay fixed.
function isNew(entry) {
  return !!store.mp3Blobs[entry.file];
}

let dragEntry = null;
const dragOverId = ref(null);

function onDragStart(entry) {
  if (!isNew(entry)) return;
  dragEntry = entry;
}

function onDragOver(event, entry) {
  if (!reorderable.value || !dragEntry || !isNew(entry)) return;
  event.preventDefault();
  dragOverId.value = entry.id;
}

function onDragLeave(entry) {
  if (dragOverId.value === entry.id) dragOverId.value = null;
}

function onDrop(event, targetEntry) {
  event.preventDefault();
  dragOverId.value = null;
  if (!reorderable.value || !dragEntry || !isNew(targetEntry) || dragEntry === targetEntry) return;
  const from = store.entries.indexOf(dragEntry);
  const to = store.entries.indexOf(targetEntry);
  if (from === -1 || to === -1) return;
  store.entries.splice(from, 1);
  store.entries.splice(to, 0, dragEntry);
  store.setStatus('Entries reordered');
}

function onDragEnd() {
  dragEntry = null;
  dragOverId.value = null;
}

function deleteEntry(idx) {
  if (!confirm(`Delete entry "${store.entries[idx].id}"?`)) return;
  store.entries.splice(idx, 1);
  store.setStatus('Entry deleted');
}

let _audioCtx = null;
let _currentSource = null;
const playing = ref(null);

async function play(filename) {
  const buf = store.mp3Blobs[filename];
  if (!buf) return;
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  stop();
  const decoded = await _audioCtx.decodeAudioData(buf.slice(0));
  const source = _audioCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(_audioCtx.destination);
  source.onended = () => {
    if (_currentSource === source) { _currentSource = null; playing.value = null; }
  };
  source.start();
  _currentSource = source;
  playing.value = filename;
}

function stop() {
  if (_currentSource) { try { _currentSource.stop(); } catch {} }
  _currentSource = null;
  playing.value = null;
}
</script>
