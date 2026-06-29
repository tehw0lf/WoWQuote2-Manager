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
      <span class="count-label">{{ visible.length }} / {{ store.entries.length }} entries</span>
    </div>

    <div class="entry-list">
      <table>
        <thead>
          <tr>
            <th @click="setSort('id')">ID {{ sortIndicator('id') }}</th>
            <th @click="setSort('msg')">Message {{ sortIndicator('msg') }}</th>
            <th @click="setSort('file')">File {{ sortIndicator('file') }}</th>
            <th @click="setSort('len')">Len {{ sortIndicator('len') }}</th>
            <th @click="setSort('cat')">Cat {{ sortIndicator('cat') }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, visIdx) in visible" :key="e.id">
            <td class="id-col">{{ e.id }}</td>
            <td>{{ e.msg }}</td>
            <td class="file-col">{{ e.file }}</td>
            <td class="len-col">{{ e.len }}s</td>
            <td class="cat-col">{{ store.catName(e.cat) }}</td>
            <td class="actions">
              <button
                class="btn small"
                :disabled="!store.mp3Blobs[e.file]"
                :title="store.mp3Blobs[e.file] ? 'Play' : 'Not loaded'"
                @click="play(e.file)"
              >▶</button>
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

const visible = computed(() => {
  const q = search.value.toLowerCase();
  let list = store.entries.filter(e => {
    if (catFilter.value && e.cat !== catFilter.value) return false;
    if (q && !e.msg.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
    return true;
  });
  list = [...list].sort((a, b) => {
    let va = a[sortCol.value], vb = b[sortCol.value];
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return sortAsc.value ? -1 : 1;
    if (va > vb) return sortAsc.value ? 1 : -1;
    return 0;
  });
  return list;
});

function deleteEntry(idx) {
  if (!confirm(`Delete entry "${store.entries[idx].id}"?`)) return;
  store.entries.splice(idx, 1);
  store.setStatus('Entry deleted');
}

let _audioCtx = null;
let _currentSource = null;

async function play(filename) {
  const buf = store.mp3Blobs[filename];
  if (!buf) return;
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_currentSource) { try { _currentSource.stop(); } catch {} }
  const decoded = await _audioCtx.decodeAudioData(buf.slice(0));
  const source = _audioCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(_audioCtx.destination);
  source.start();
  _currentSource = source;
}
</script>
