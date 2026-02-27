// ============================================================
// SPLITX Tool — Export
// ============================================================

import { exportSettings } from './state.js';

/**
 * Run the appropriate export based on exportSettings.fileType.
 * @param {HTMLCanvasElement} canvasEl  — the live paper.js canvas
 * @param {object}           paperProj — paper.project
 * @param {object}           renderFn  — { startLoop, stopLoop, advanceFrame }
 */
export async function exportComposition(canvasEl, paperProj, renderFn) {
  const { fileType, size, length, quality } = exportSettings;

  switch (fileType) {
    case 'svg':           return exportSVG(paperProj, renderFn.renderForSVG);
    case 'png':           return exportPNG(canvasEl, size);
    case 'mp4':           return exportVideo(canvasEl, length, quality, renderFn);
    case 'png-sequence':  return exportSequence(canvasEl, length, 'png', renderFn);
    case 'webp-sequence': return exportSequence(canvasEl, length, 'webp', renderFn);
  }
}

// ── SVG ──────────────────────────────────────────────────────
function exportSVG(paperProj, renderForSVG) {
  if (renderForSVG) renderForSVG(); // rebuild paper.js scene
  const svg = paperProj.exportSVG({ asString: true });
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'splitx-export.svg');
  paperProj.activeLayer.removeChildren(); // clean up after export
}

// ── PNG ──────────────────────────────────────────────────────
function exportPNG(canvasEl, sizeMult) {
  const off = document.createElement('canvas');
  off.width  = Math.floor(canvasEl.width  * sizeMult);
  off.height = Math.floor(canvasEl.height * sizeMult);
  const ctx = off.getContext('2d');
  ctx.scale(sizeMult, sizeMult);
  ctx.drawImage(canvasEl, 0, 0);
  off.toBlob(blob => downloadBlob(blob, 'splitx-export.png'), 'image/png');
}

// ── Video (MP4 / WebM fallback) ───────────────────────────────
async function exportVideo(canvasEl, length, quality, renderFn) {
  renderFn.startLoop();

  const stream   = canvasEl.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: quality * 80000,
  });

  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise(resolve => {
    recorder.onstop = () => {
      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType });
      downloadBlob(blob, `splitx-export.${ext}`);
      resolve();
    };
  });

  exportSettings.status = 'Recording…';
  recorder.start();
  await new Promise(r => setTimeout(r, length * 1000));
  recorder.stop();
  renderFn.stopLoop();
  await done;
  exportSettings.status = 'Done';
  setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
}

// ── Frame sequence ────────────────────────────────────────────
async function exportSequence(canvasEl, length, format, renderFn) {
  const fps         = 30;
  const totalFrames = Math.floor(length * fps);
  const dt          = 1 / fps;

  renderFn.startLoop();
  exportSettings.status = `Exporting 0 / ${totalFrames}…`;

  for (let frame = 0; frame < totalFrames; frame++) {
    renderFn.advanceFrame(dt);
    await new Promise(r => requestAnimationFrame(r));

    await new Promise(resolve => {
      const mime = format === 'webp' ? 'image/webp' : 'image/png';
      canvasEl.toBlob(blob => {
        const n = frame.toString().padStart(5, '0');
        downloadBlob(blob, `splitx-frame-${n}.${format}`);
        resolve();
      }, mime, 0.9);
    });

    exportSettings.status = `Exporting ${frame + 1} / ${totalFrames}…`;
  }

  renderFn.stopLoop();
  exportSettings.status = 'Done';
  setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
}

// ── Utility ───────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
