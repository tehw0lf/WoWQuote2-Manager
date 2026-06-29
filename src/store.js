import { reactive } from 'vue';

export const store = reactive({
  entries: [],
  categories: [],
  mp3Blobs: {},              // filename → ArrayBuffer (new MP3s to include in export)
  localizationSources: {},   // filename → string (loaded Localization.*.lua content)
  status: { msg: 'No data loaded. Load a media_data.lua file to begin.', error: false },

  setStatus(msg, error = false) {
    this.status = { msg, error };
  },

  getPrefix(id) {
    const m = id.match(/^([^:]+):/);
    return m ? m[1] : 'default';
  },

  nextIdForPrefix(prefix) {
    const nums = this.entries
      .filter(e => this.getPrefix(e.id) === prefix)
      .map(e => { const m = e.id.match(/:(\d+)$/); return m ? parseInt(m[1]) : 0; });
    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}:${String(max + 1).padStart(3, '0')}`;
  },

  idToFilename(id) {
    return id.replace(':', '_') + '.mp3';
  },

  catName(catIdx) {
    const cat = this.categories[catIdx - 1];
    return cat ? (cat.en || '') : '?';
  },

  reset() {
    this.entries = [];
    this.categories = [];
    this.mp3Blobs = {};
    this.localizationSources = {};
  },
});
