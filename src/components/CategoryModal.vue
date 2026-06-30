<template>
  <div class="modal-bg" @click.self="$emit('close')">
    <div class="modal">
      <h2>Manage Categories</h2>

      <div class="cat-list">
        <p v-if="!store.categories.length" class="muted">No categories yet — add one below.</p>
        <div v-for="(cat, i) in store.categories" :key="i" class="cat-item">
          <span class="cat-label">
            <strong>{{ i + 1 }}</strong>: {{ cat.en }}
            <span v-if="cat.de" class="cat-sub"> / {{ cat.de }}</span>
          </span>
          <button class="btn small" @click="editCat(i)">Edit</button>
          <button class="btn small danger" @click="deleteCat(i)">Del</button>
        </div>
      </div>

      <h3 class="form-subtitle">{{ editIdx !== null ? `Edit Category ${editIdx + 1}` : 'Add Category' }}</h3>

      <div class="locale-grid">
        <span class="locale-code">en *</span>
        <input v-model="form.en" type="text" placeholder="English name (required)">
        <span class="locale-code">de</span>
        <input v-model="form.de" type="text" placeholder="Deutsch">
        <span class="locale-code">fr</span>
        <input v-model="form.fr" type="text" placeholder="Français">
        <span class="locale-code">nl</span>
        <input v-model="form.nl" type="text" placeholder="Nederlands">
        <span class="locale-code">es</span>
        <input v-model="form.es" type="text" placeholder="Español">
        <span class="locale-code">pt</span>
        <input v-model="form.pt" type="text" placeholder="Português">
      </div>

      <div class="modal-footer">
        <button class="btn" @click="clearForm">Clear</button>
        <button class="btn" @click="$emit('close')">Close</button>
        <button class="btn primary" @click="saveCat">{{ editIdx !== null ? 'Update' : 'Add' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { store } from '../store.js';

defineEmits(['close']);

const editIdx = ref(null);
const form = reactive({ en: '', de: '', fr: '', nl: '', es: '', pt: '' });

function editCat(i) {
  editIdx.value = i;
  const cat = store.categories[i];
  ['en', 'de', 'fr', 'nl', 'es', 'pt'].forEach(l => { form[l] = cat[l] || ''; });
}

function deleteCat(i) {
  if (!confirm(`Delete category "${store.categories[i].en}"?`)) return;
  store.categories.splice(i, 1);
  if (editIdx.value === i) clearForm();
}

function clearForm() {
  editIdx.value = null;
  ['en', 'de', 'fr', 'nl', 'es', 'pt'].forEach(l => { form[l] = ''; });
}

function saveCat() {
  if (!form.en.trim()) { alert('English name is required'); return; }
  const cat = {};
  ['en', 'de', 'fr', 'nl', 'es', 'pt'].forEach(l => { if (form[l].trim()) cat[l] = form[l].trim(); });
  if (editIdx.value !== null) {
    store.categories[editIdx.value] = cat;
  } else {
    store.categories.push(cat);
  }
  clearForm();
}
</script>
