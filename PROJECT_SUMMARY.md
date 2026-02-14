# Creative Suite - Project Summary

## What Was Created

A unified **Creative Suite** application that combines 6 creative tools into one Electron/Web app with a shared navigation system.

## Structure

```
creative-suite/
├── index.html              # Main entry point with sidebar navigation
├── package.json            # Dependencies & build scripts
├── vite.config.js          # Vite configuration
├── README.md               # Full documentation
│
├── electron/               # Electron desktop app files
│   ├── main.js            # Main process with menus
│   └── preload.js         # Secure IPC bridge
│
├── styles/
│   └── main.css           # Unified dark theme styling
│
└── src/
    ├── main.js            # App router & tool lifecycle
    └── tools/
        ├── index.js       # Tool registry
        ├── dither/        # DITHR - Image dithering
        ├── flake/         # FLAKE - Grid patterns
        ├── refract/       # REFRACT - Image displacement
        ├── split/         # SPLITX - Vector art
        ├── textr/         # TEXTR - Typography
        └── rhythm/        # RITM - Rhythm sequencer
```

## How It Works

### Web App
1. **Navigation**: Left sidebar with 6 tool buttons
2. **Dynamic Loading**: Tools loaded on-demand via dynamic imports
3. **Tool Lifecycle**: 
   - Cleanup previous p5 instance
   - Mount new tool in canvas/pane containers
   - Configure file input accept types
4. **Keyboard Shortcuts**: `Cmd/Ctrl + 1-6` switches tools

### Electron App
Same as web app, plus:
- Native menus with tool switching
- File open/save dialogs
- Desktop packaging for Mac/Win/Linux

## Key Features

| Feature | Implementation |
|---------|----------------|
| Tool Switching | Dynamic ES module imports |
| p5.js Integration | Instance mode with proper cleanup |
| Paper.js | Integrated with SPLITX and TEXTR |
| UI Controls | Simplified inline HTML for tool panels |
| File Handling | Global file input + drag-drop per tool |
| Styling | Unified CSS variables, dark theme |

## Usage

### Development (Web)
```bash
cd creative-suite
npm install
npm run dev
```

### Development (Desktop)
```bash
npm run dev:electron
```

### Build (Web)
```bash
npm run build
```

### Build (Desktop)
```bash
npm run build:electron
```

## Tool Adapters

Each tool has an `index.js` adapter that:
- Creates a p5 instance in the provided container
- Sets up tool-specific UI in the pane container
- Returns `{ p5Instance, uiInstance, handleFile }`

Example:
```javascript
export async function loadDitherTool(canvasContainer, paneContainer) {
  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(640, 640);
      canvas.parent(canvasContainer);
      // ... tool logic
    };
  };
  
  const p5Instance = new p5(sketch, canvasContainer);
  
  return { p5Instance, handleFile: (file) => { /* ... */ } };
}
```

## Dependencies

```json
{
  "p5": "^2.2.1",
  "paper": "^0.12.18", 
  "tweakpane": "^4.0.5",
  "simplex-noise": "^4.0.3",
  "electron": "^28.0.0",
  "vite": "^5.0.0"
}
```

## Notes

- The original `main.js` files in each tool folder are not used (adapters replace them)
- Some complex UI features from original tools have been simplified
- Full Tweakpane integration would require additional setup per tool
- File drag-drop works on the canvas area for each tool

## Next Steps (Optional Enhancements)

1. **Full Tweakpane Integration**: Add proper Tweakpane UIs to each tool
2. **Export Functionality**: Implement save/export for each tool
3. **Preset Management**: Add preset save/load across tools
4. **State Persistence**: Remember tool settings between sessions
5. **Electron Auto-Updater**: Add automatic updates for desktop app
