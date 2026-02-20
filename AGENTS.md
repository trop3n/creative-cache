# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Creative Suite is an Electron/Web application combining 6 creative tools for generative art and design. Built with p5.js, Paper.js, and Vite.

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Development (web)
npm run dev:electron # Development (Electron)
npm run build        # Build for production (web)
npm run build:electron # Build for desktop
npm run lint         # Lint code
npm test             # Tests (not configured yet)
```

## File Organization

```
src/
├── main.js           # App entry point and router
├── tools/
│   ├── index.js      # Tool registry
│   └── [tool]/       # Each tool in its own folder
│       ├── index.js  # Tool adapter (required)
│       ├── state.js  # Tool state management
│       └── ui.js     # UI controls
└── shared/           # Shared utilities
```

## Code Style

### Section Headers

```javascript
// ============================================================
// Section Name
// ============================================================
```

### Imports

Group external libraries first, then internal modules:

```javascript
import p5 from 'p5';
import paper from 'paper';
import { config } from './state.js';
```

### State Management

Use plain mutable objects:

```javascript
const state = {
  currentTool: null,
  p5Instance: null,
  isTransitioning: false
};
```

### Tool Adapters

Each tool exports a load function:

```javascript
export async function loadToolName(canvasContainer, paneContainer) {
  let p5Instance = null;

  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(640, 640);
      canvas.parent(canvasContainer);
      p.pixelDensity(1);
    };
    p.draw = () => { /* drawing logic */ };
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    handleFile: (file) => { /* file handling */ }
  };
}
```

### p5.js Patterns

- Always use instance mode
- Set `pixelDensity(1)` for consistent rendering
- Clean up with `p5Instance.remove()` when switching tools

### Error Handling

```javascript
try {
  const tool = await toolConfig.load(canvasContainer, paneContainer);
} catch (error) {
  console.error('Failed to load tool:', error);
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `loadDitherTool` |
| Variables | camelCase | `canvasContainer` |
| CSS classes | kebab-case | `tool-btn` |
| CSS variables | kebab-case | `--bg-primary` |

### Comments

Use JSDoc for public functions:

```javascript
/** Parse hex color string to [r, g, b] array. */
function hexToRGB(hex) { }
```

### Async/Await

Prefer async/await over raw Promises.

### CSS Guidelines

- Use CSS variables for theming in `:root`
- Follow dark theme color palette

### Electron Integration

Check environment before using Electron APIs:

```javascript
if (typeof window.electronAPI !== 'undefined') {
  window.electronAPI.onSwitchTool((event, toolId) => loadTool(toolId));
}
```

### Adding a New Tool

1. Create folder: `src/tools/mytool/`
2. Create `index.js` with `loadMyTool(canvasContainer, paneContainer)`
3. Add to registry in `src/tools/index.js`:
   ```javascript
   mytool: {
     id: 'mytool',
     name: 'MYTOOL',
     accept: 'image/*',
     load: async (canvas, pane) => {
       const { loadMyTool } = await import('./mytool/index.js');
       return loadMyTool(canvas, pane);
     }
   }
   ```
4. Add button to `index.html` sidebar

### Do Not

- Use CommonJS `require()` - use ES module `import`
- Mutate global state outside tool modules
- Leave console.log statements in production
- Skip cleanup when switching tools (memory leaks)
