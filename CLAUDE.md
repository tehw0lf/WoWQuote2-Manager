# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based manager for the [WoWQuote2](https://github.com/tehw0lf/WoWQuote2) WoW addon. Replaces the Python `insert_and_build.py` build script. Users load their `media_data.lua`, manage sound entries and categories, upload new MP3s, and export incremental update ZIPs (only new MP3s + patched Lua files).

## Commands

```bash
npm run dev      # dev server at http://localhost:5173/WoWQuote2-Manager/
npm run build    # production build → dist/
npm run preview  # preview production build
```

No linter or test suite is configured.

## Architecture

Single-page Vue 3 app (Composition API, `<script setup>`), no router. All state lives in a single reactive store (`src/store.js`).

### Data flow

1. **Load**: User drops `media_data.lua` (and optionally `Localization.*.lua` or a ZIP) into the Sidebar drop zone. `parseLua.js` extracts `WQmedia_data` (entries) and `WQcategories_data` (categories) into the store.
2. **Edit**: `EntryList` → `EntryModal` for add/edit. `CategoryModal` for category CRUD. New MP3 uploads go into `store.mp3Blobs` (filename → ArrayBuffer); Web Audio API auto-detects duration.
3. **Export**: `App.vue::exportZip(variant)` builds a JSZip in-browser:
   - `Media.lua` generated from `store.entries` via `serializeMediaLua()`
   - Each `Localization.*.lua`: taken from `store.localizationSources` if the user uploaded it, otherwise fetched from `https://raw.githubusercontent.com/tehw0lf/WoWQuote2/main/WoWQuote2/`. The `WQcategories` block is then replaced via `patchLocalization()`.
   - New MP3s from `store.mp3Blobs` added under `WoWQuote2/media/`.
   - Result downloaded as `WQ2-<variant>-<date>.zip` (variants: TBC / Vanilla / WOTLK).
4. **Save**: `media_data.lua` can be saved at any time via `serializeMediaData()` for round-tripping.

### Key files

| File | Purpose |
|---|---|
| `src/store.js` | Reactive state: `entries`, `categories`, `mp3Blobs`, `localizationSources`, `status` |
| `src/lib/parseLua.js` | Parses `media_data.lua` — stack-based brace matching for entries, regex for categories |
| `src/lib/serializeLua.js` | `serializeMediaLua()`, `serializeMediaData()`, `patchLocalization()` |
| `src/lib/addonFiles.js` | `LOCALIZATION_FILES` list and `LOCALE_FOR_FILE` map |
| `src/components/Sidebar.vue` | File loading (`.lua`, `.zip`, multiple files), MP3 batch drop with prefix/category auto-detection |
| `src/App.vue` | Export logic, modal orchestration |

### Lua data formats

`media_data.lua` (private, not committed to addon repo) stores both datasets:
```lua
WQcategories_data = { { en = "Name", de = "Name" }, ... };
WQmedia_data = { { id = "prefix:001", file = "prefix_001.mp3", len = 3, msg = "...", cat = 1 }, ... };
```

Sound IDs follow the pattern `prefix:NNN` (e.g. `murfy:042`), filenames `prefix_NNN.mp3`. `store.nextIdForPrefix()` auto-increments per prefix.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on push to `main` and deploys `dist/` to GitHub Pages. `vite.config.js` sets `base: '/WoWQuote2-Manager/'` for correct asset paths.
