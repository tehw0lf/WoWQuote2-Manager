# WoWQuote2 Manager

Browser-based manager for the [WoWQuote2](https://github.com/tehw0lf/WoWQuote2) WoW addon. Replaces the old Python `insert_and_build.py` build script with a Vue 3 single-page app that runs entirely client-side — nothing is uploaded anywhere.

Drop in MP3s, manage sound entries and categories, and export an incremental update ZIP containing the new MP3s and patched Lua files. Starting from nothing works — load an existing `media_data.lua` only when you want to pick up where you left off.

**Live app:** https://tehw0lf.github.io/WoWQuote2-Manager/

## Features

- Start from an empty state — dropping MP3s alone is enough to produce a working export
- Optionally load `media_data.lua` (and `Localization.*.lua` files or a ZIP) via drag & drop to resume an existing collection
- Add, edit, and delete sound entries and categories
- Batch-drop MP3s with automatic prefix/category detection and duration detection (Web Audio API)
- Play/stop preview of loaded MP3s directly in the browser
- Drag & drop reordering of entries (determines order in the generated `Media.lua`)
- Search and filter entries by message, ID, or category
- Export an incremental update ZIP per game version (TBC / Vanilla / WOTLK) containing only new MP3s and patched Lua files
- Save `media_data.lua` at any time for round-tripping

## Usage

You do not need to load anything first. Dropping MP3s into an empty Manager is enough: it assigns ids, reads durations, and creates categories from the filename prefixes.

1. Open the [live app](https://tehw0lf.github.io/WoWQuote2-Manager/) (or run it locally, see below).
2. Drop your MP3 files into the sidebar. Adjust messages, categories and entry order as needed.
3. Export an update ZIP for your target game version and extract it over the `WoWQuote2` folder in your addon directory.
4. Restart the game — WoW reads addon files only at startup.

### Resuming an existing collection

If you already have a setup, drop your `media_data.lua` in first and the Manager loads your existing entries and categories. The sidebar takes a `.zip` as well as loose `.lua` files, so a previously exported update ZIP can be dragged straight back in — note that only the Lua files are read out of it, not the MP3s.

Save `media_data.lua` when you are done. That file is what makes the next session a resume rather than a fresh start, and it is deliberately never committed to the addon repo.

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
