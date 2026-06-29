<template>
  <div class="modal-bg" @click.self="$emit('close')">
    <div class="modal">
      <h2>{{ entry ? 'Edit Sound Entry' : 'Add Sound Entry' }}</h2>

      <div class="form-row">
        <label>ID <span class="muted">(auto-generated)</span></label>
        <input :value="localId" type="text" readonly class="muted-input">
      </div>

      <div class="form-row-2">
        <div class="form-row">
          <label>File</label>
          <input v-model="form.file" type="text" placeholder="prefix_001.mp3">
        </div>
        <div class="form-row">
          <label>Duration (s)</label>
          <input v-model.number="form.len" type="number" min="0" step="1">
        </div>
      </div>

      <div class="form-row">
        <label>Message</label>
        <input v-model="form.msg" type="text" placeholder="Display text">
      </div>

      <div class="form-row">
        <label>Category</label>
        <select v-model.number="form.cat">
          <option v-for="(cat, i) in store.categories" :key="i" :value="i + 1">
            {{ i + 1 }}: {{ cat.en }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label>Upload MP3 <span class="muted">(auto-detects duration)</span></label>
        <div
          class="drop-zone"
          :class="{ dragover: dragging }"
          @click="$refs.fileInput.click()"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >{{ mp3Label }}</div>
        <input ref="fileInput" type="file" accept=".mp3" style="display:none" @change="onFileChange">
      </div>

      <div class="modal-footer">
        <button class="btn" @click="$emit('close')">Cancel</button>
        <button class="btn primary" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

function extractPrefix(filename) {
  const m = filename.match(/^([a-z0-9]+)_\d+\.mp3$/i);
  return m ? m[1].toLowerCase() : null;
}

function resolveCategory(p) {
  const idx = store.categories.findIndex(c => c.en.toLowerCase() === p.toLowerCase());
  if (idx !== -1) return idx + 1;
  store.categories.push({ en: p.charAt(0).toUpperCase() + p.slice(1) });
  return store.categories.length;
}
import { store } from '../store.js';

const props = defineProps({ entry: Object, entryIdx: { type: Number, default: null }, prefix: String });
const emit = defineEmits(['close', 'saved']);

const dragging = ref(false);
const mp3Label = ref('Drop MP3 here or click');

const localId = computed(() =>
  props.entry ? props.entry.id : store.nextIdForPrefix(props.prefix || 'default')
);

const form = reactive({ file: '', len: 0, msg: '', cat: 1 });

onMounted(() => {
  if (props.entry) {
    form.file = props.entry.file;
    form.len  = props.entry.len;
    form.msg  = props.entry.msg;
    form.cat  = props.entry.cat;
  } else {
    form.file = store.idToFilename(localId.value);
    form.cat  = store.categories.length ? 1 : 1;
  }
});

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

async function handleMp3(file) {
  const buf = await file.arrayBuffer();
  store.mp3Blobs[form.file || file.name] = buf;
  // If adding a new entry and the file follows prefix_NNN.mp3 naming, auto-resolve category
  if (!props.entry) {
    const detected = extractPrefix(file.name);
    if (detected) form.cat = resolveCategory(detected);
  }
  try {
    const decoded = await getAudioCtx().decodeAudioData(buf.slice(0));
    form.len = Math.round(decoded.duration);
    mp3Label.value = `${file.name} (${form.len}s)`;
  } catch {
    mp3Label.value = file.name;
  }
}

function onDrop(e) {
  dragging.value = false;
  const f = e.dataTransfer.files[0];
  if (f) handleMp3(f);
}

function onFileChange(e) {
  if (e.target.files[0]) handleMp3(e.target.files[0]);
}

function save() {
  if (!form.msg.trim()) { store.setStatus('Message is required', true); return; }
  if (!form.file.trim()) { store.setStatus('File name is required', true); return; }

  if (props.entryIdx !== null) {
    store.entries[props.entryIdx] = { ...store.entries[props.entryIdx], ...form };
  } else {
    store.entries.push({ id: localId.value, ...form });
  }
  store.setStatus(props.entryIdx !== null ? 'Entry updated' : 'Entry added');
  emit('saved');
  emit('close');
}
</script>
