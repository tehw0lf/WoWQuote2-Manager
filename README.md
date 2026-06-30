# WoWQuote2 Manager

Browser-based manager for the [WoWQuote2](https://github.com/tehw0lf/WoWQuote2) WoW addon. Replaces the old Python `insert_and_build.py` build script with a Vue 3 single-page app that runs entirely client-side — nothing is uploaded anywhere.

Load your `media_data.lua`, manage sound entries and categories, drop in new MP3s, and export an incremental update ZIP containing only the new MP3s and patched Lua files.

**Live app:** https://tehw0lf.github.io/WoWQuote2-Manager/

## Features

- Load `media_data.lua` (and optionally `Localization.*.lua` files or a ZIP) via drag & drop
- Add, edit, and delete sound entries and categories
- Batch-drop MP3s with automatic prefix/category detection and duration detection (Web Audio API)
- Play/stop preview of loaded MP3s directly in the browser
- Drag & drop reordering of entries (determines order in the generated `Media.lua`)
- Search and filter entries by message, ID, or category
- Export an incremental update ZIP per game version (TBC / Vanilla / WOTLK) containing only new MP3s and patched Lua files
- Save `media_data.lua` at any time for round-tripping

## Usage

1. Open the [live app](https://tehw0lf.github.io/WoWQuote2-Manager/) (or run it locally, see below).
2. Drop your `media_data.lua` into the sidebar to load existing entries and categories.
3. Add/edit entries, drop in new MP3 files, manage categories.
4. Export an update ZIP for your target game version and drop it into your addon folder.

No data leaves your browser except fetching the base `Localization.*.lua` files from the [WoWQuote2 repo](https://github.com/tehw0lf/WoWQuote2) when you haven't supplied your own.

## Development

```bash
npm install
npm run dev      # dev server at http://localhost:5173/WoWQuote2-Manager/
npm run build    # production build → dist/
npm run preview  # preview production build
```

No linter or test suite is configured. See [CLAUDE.md](CLAUDE.md) for an architecture overview.

## Deployment

Pushes to `main` are built and deployed to GitHub Pages automatically via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

See the [WoWQuote2](https://github.com/tehw0lf/WoWQuote2) addon repository for licensing of the addon itself.
