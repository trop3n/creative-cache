# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run dev:electron     # Run Electron app against Vite dev server
npm run build            # Production web build → dist/
npm run build:electron   # Package desktop app → release/
npm run lint             # ESLint on .js files
```

No tests are configured yet (`npm test` is a placeholder).

## Architecture

Creative Suite is a modular Electron + Vite web app combining 8 generative art tools: DITHR (image dithering), FLAKE (grid patterns), REFRACT (image displacement), SPLITX (vector duplication), TEXTR (typography), RITM (rhythm visualizer), BOIDS (flocking simulation), and TRACK (motion tracking effects).

**Tool loading flow** — `src/main.js` is the app router. When the user switches tools, it:
1. Cleans up the current tool (calls `p5Instance.remove()`, disposes UI)
2. Dynamically imports the tool module
3. Calls `load(canvasContainer, paneContainer)` and stores the returned `{ p5Instance, uiInstance, handleFile }`

**Tool structure** — Each tool in `src/tools/[tool]/` is self-contained. The only required file is:
- `index.js` — exports `loadToolName(canvasContainer, paneContainer)`, returns `{ p5Instance, uiInstance, handleFile }`

Common optional files (use as needed):
- `state.js` — plain mutable config/state objects
- `ui.js` — Tweakpane control setup
- `main.js` — core rendering logic
- `media.js` — file/asset handling
- `presets.js` — named preset configurations
- `export.js` — export/save logic
- `shaders.js` — GLSL shader strings (used by dither, refract)
- `effects.js` — post-processing or visual effects pipeline
- `motion.js` — motion analysis / tracking logic

**Tool registry** — `src/tools/index.js` maps tool IDs to metadata and lazy-import loaders, and exports `toolOrder` for navigation. Adding a new tool requires: adding an entry here, adding a sidebar button in `index.html`, and creating the tool directory.

**Keyboard shortcuts** — `Ctrl/Cmd + 1–8` switches between tools in `toolOrder` sequence.

**Electron IPC** — `electron/preload.js` exposes `window.electronAPI` (tool switching, file open, save dialog). Always guard Electron-specific code:
```javascript
if (typeof window.electronAPI !== 'undefined') { ... }
```

**File handling** — A single hidden `#fileInput` element is shared globally. Tools should call `triggerFileUpload()` (exported from `src/main.js`) to open the file picker, not access `#fileInput` directly. Each tool's `handleFile(file)` method processes the selected file. The `accept` attribute is set per-tool from the registry.

## Key Dependencies

- **p5.js** — canvas rendering, always instance mode with `pixelDensity(1)`
- **Tweakpane** — right-pane UI controls
- **paper.js** — vector graphics (used by split/SPLITX)
- **simplex-noise** — noise generation

## Code Conventions

- **p5.js** always in instance mode with `pixelDensity(1)`; never use global mode
- **ES modules only** — no CommonJS `require()`
- **State** via plain mutable objects, never framework state managers
- **Section headers** use `// ============================================================`
- **Imports** grouped: external libraries first, then internal modules
- **Naming**: camelCase for functions/variables, kebab-case for CSS classes and CSS variables
- **JSDoc** for exported/public functions

## CSS Theme

All colors and layout dimensions are CSS variables in `styles/main.css` (e.g. `--bg-primary`, `--accent-primary: #4a9eff`, `--sidebar-width: 280px`, `--pane-width: 320px`). Dark theme throughout.
