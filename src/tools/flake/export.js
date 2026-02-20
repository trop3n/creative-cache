// ============================================================
// FLAKE Tool — Export system
// ============================================================

import { canvas, exportSettings, motion } from './state.js';
import { renderPattern } from './grid.js';

let mediaRecorder   = null;
let recordedChunks  = [];
let isRecording     = false;

/**
 * Export the current composition.
 * @param {p5}    p
 * @param {number} frameCount
 */
export async function exportComposition(p, frameCount = 0) {
  const { format } = exportSettings;

  if (format === 'webm') {
    await exportWebM(p);
    return;
  }

  exportSettings.status = 'Exporting…';

  try {
    switch (format) {
      case 'svg':      await exportSVG(p);      break;
      case 'sequence': await exportSequence(p); break;
      default:         await exportPNG(p);       break;
    }
    exportSettings.status = 'Done!';
  } catch (err) {
    console.error('FLAKE export failed:', err);
    exportSettings.status = 'Error!';
  }

  setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
}

export function getIsRecording() { return isRecording; }

// ── PNG ───────────────────────────────────────────────────────

async function exportPNG(p) {
  const scale = exportSettings.scale;
  const w = canvas.width  * scale;
  const h = canvas.height * scale;

  const pg = p.createGraphics(w, h);
  pg.pixelDensity(1);
  pg.scale(scale);

  renderPattern(pg, 0);
  pg.save(`flake-export-${Date.now()}.png`);
  pg.remove();
}

// ── SVG (via p5 saveCanvas – basic) ──────────────────────────

async function exportSVG(p) {
  // p5 doesn't natively render to SVG; fall back to PNG for now
  await exportPNG(p);
}

// ── PNG sequence ──────────────────────────────────────────────

async function exportSequence(p) {
  if (motion.motionType === 'none') {
    alert('Enable motion to export a sequence.');
    return;
  }

  const totalFrames = 120;
  const scale = exportSettings.scale;
  const w = canvas.width  * scale;
  const h = canvas.height * scale;

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / totalFrames;
    const pg   = p.createGraphics(w, h);
    pg.pixelDensity(1);
    pg.scale(scale);
    renderPattern(pg, time);
    pg.save(`flake-frame-${frame.toString().padStart(4, '0')}.png`);
    pg.remove();

    exportSettings.status = `Exporting ${frame + 1}/${totalFrames}…`;
    await new Promise(r => setTimeout(r, 10));
  }
}

// ── WebM via MediaRecorder ────────────────────────────────────

async function exportWebM(p) {
  if (isRecording) {
    stopRecording();
    return;
  }

  if (!MediaRecorder.isTypeSupported('video/webm')) {
    alert('WebM not supported in this browser.');
    return;
  }

  const stream = p.canvas.captureStream(30);
  mediaRecorder = new MediaRecorder(stream, {
    mimeType:          'video/webm;codecs=vp9',
    videoBitsPerSecond: 5_000_000,
  });

  recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `flake-animation-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    exportSettings.status = 'Video saved!';
    setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
  };

  mediaRecorder.start();
  isRecording = true;
  exportSettings.status = 'Recording WebM… click Export again to stop';

  if (!motion.playing) {
    motion.playing = true;
  }
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  isRecording = false;
  mediaRecorder.stop();
  mediaRecorder = null;
}
