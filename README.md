# Creative Suite

A unified collection of creative tools for generative art and design, combining 6 individual tools into one seamless desktop and web application.

![Creative Suite Screenshot](screenshot.png)

## Included Tools

| Tool | Name | Description |
|------|------|-------------|
| ◈ | **DITHR** | Image dithering & effects with WebGL shaders |
| ◉ | **FLAKE** | Generative grid patterns with custom shapes |
| ◊ | **REFRACT** | Image displacement & refraction effects |
| ▣ | **SPLITX** | Vector art duplication & transformation |
| A | **TEXTR** | Typography generator for vector text |
| ♪ | **RITM** | Rhythm pattern visualizer & sequencer |

## Quick Start

### Web App (Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Desktop App (Electron)

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev:electron

# Build for production
npm run build:electron
```

## Building

### Web Build
```bash
npm run build
```
Output will be in `dist/` directory.

### Desktop Builds
```bash
# Build for current platform
npm run build:electron

# Build for specific platforms
npx electron-builder --mac
npx electron-builder --win
npx electron-builder --linux
```

Output will be in `release/` directory.

## Features

- **Unified Interface**: All 6 tools accessible from a single sidebar navigation
- **Keyboard Shortcuts**: 
  - `Cmd/Ctrl + 1-6`: Switch between tools
  - `Cmd/Ctrl + O`: Open file
  - `Cmd/Ctrl + S`: Save export
- **Drag & Drop**: Drop files directly onto the canvas for each tool
- **Consistent Theme**: Dark mode UI with unified styling
- **Electron Integration**: Native desktop menus and file dialogs

## Architecture

```
creative-suite/
├── index.html              # Main entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite build configuration
├── electron/
│   ├── main.js            # Electron main process
│   └── preload.js         # Electron preload script
├── styles/
│   └── main.css           # Global styles
├── src/
│   ├── main.js            # App initialization & router
│   ├── tools/
│   │   ├── index.js       # Tool registry
│   │   ├── dither/        # DITHR tool
│   │   ├── flake/         # FLAKE tool
│   │   ├── refract/       # REFRACT tool
│   │   ├── split/         # SPLITX tool
│   │   ├── textr/         # TEXTR tool
│   │   └── rhythm/        # RITM tool
│   └── shared/            # Shared utilities
└── dist/                  # Build output
```

## Tool Integration

Each tool is integrated as a module that exports a `load` function:

```javascript
export async function loadTool(canvasContainer, paneContainer) {
  // Initialize p5.js sketch
  // Set up UI
  // Return tool instance
}
```

The main app:
1. Dynamically imports the tool module when selected
2. Cleans up the previous tool's p5 instance
3. Mounts the new tool in the containers
4. Handles file operations

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Switch to DITHR |
| `Cmd/Ctrl + 2` | Switch to FLAKE |
| `Cmd/Ctrl + 3` | Switch to REFRACT |
| `Cmd/Ctrl + 4` | Switch to SPLITX |
| `Cmd/Ctrl + 5` | Switch to TEXTR |
| `Cmd/Ctrl + 6` | Switch to RITM |
| `Cmd/Ctrl + O` | Open file |
| `Cmd/Ctrl + S` | Save export |

## File Support

| Tool | Supported Files |
|------|-----------------|
| DITHR | Images (PNG, JPG), Videos |
| FLAKE | SVG, Images |
| REFRACT | Images, JSON presets |
| SPLITX | SVG, JSON |
| TEXTR | TTF, OTF, WOFF, WOFF2, JSON |
| RITM | - (no file input) |

## Development

### Adding a New Tool

1. Create a new folder in `src/tools/yourtool/`
2. Create `index.js` with a `loadYourTool` function
3. Add tool configuration to `src/tools/index.js`
4. Add sidebar button to `index.html`

### Modifying Existing Tools

Tool source code is in `src/tools/[tool-name]/`. Each tool has its own:
- State management
- p5.js sketch
- UI controls
- File handling

## Dependencies

- **p5.js** - Creative coding library
- **paper.js** - Vector graphics scripting
- **tweakpane** - UI controls
- **simplex-noise** - Noise generation
- **Electron** - Desktop app framework
- **Vite** - Build tool

## License

MIT License - See LICENSE file for details

## Credits

Original tools:
- DitherTool
- FlakeTool
- fracc
- split
- txtr
- RhythmGenerator

Combined and adapted for Creative Suite.
