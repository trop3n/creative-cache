// ============================================================
// TRACK Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import { canvas, exportSettings, source, motion, updateCanvasSize, getPerformanceResolution } from './state.js';
import { MotionDetector } from './motion.js';
import { EffectRenderer } from './effects.js';
import { stopVideo, loadVideoFile } from './media.js';
import { setupUI, setStatus, refreshUI } from './ui.js';

export async function loadTrackTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let uiInstance = null;
  let motionDetector = null;
  let effectRenderer = null;
  let isSetup = false;
  
  let frameCanvas = null;
  let frameCtx = null;
  let videoBuffer = null;
  
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;

  updateCanvasSize();

  const sketch = (p) => {
    p.setup = () => {
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);

      const perfRes = getPerformanceResolution();
      motionDetector = new MotionDetector(perfRes.width, perfRes.height);
      effectRenderer = new EffectRenderer(canvas.width, canvas.height);

      frameCanvas = document.createElement('canvas');
      frameCanvas.width = perfRes.width;
      frameCanvas.height = perfRes.height;
      frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
      
      videoBuffer = p.createGraphics(canvas.width, canvas.height);
      videoBuffer.pixelDensity(1);

      uiInstance = setupUI(paneContainer, {
        onParamChange: () => {},
        
        onCanvasChange: () => {
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          videoBuffer.setSize(canvas.width, canvas.height);
          effectRenderer.resize(canvas.width, canvas.height);
        },
        
        onSpeedChange: (speed) => {
          if (source.video) {
            source.video.playbackRate = speed;
          }
        },
        
        onSourceReady: (video) => {
          const size = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
          const aspect = size.width / size.height;
          
          if (aspect > 1) {
            canvas.aspectRatio = '16:9';
          } else {
            canvas.aspectRatio = '9:16';
          }
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          videoBuffer.setSize(canvas.width, canvas.height);
          
          const perfRes = getPerformanceResolution();
          frameCanvas.width = perfRes.width;
          frameCanvas.height = perfRes.height;
          motionDetector.resize(perfRes.width, perfRes.height);
          effectRenderer.resize(canvas.width, canvas.height);
          
          video.playbackRate = source.playbackSpeed;
          refreshUI();
        },
        
        onSourceStop: () => {
          const perfRes = getPerformanceResolution();
          motionDetector.resize(perfRes.width, perfRes.height);
        },
        
        onExport: (format) => handleExport(p, format),
      });

      p.background(canvas.background);
      p.loop();
      isSetup = true;
    };

    p.draw = () => {
      if (!isSetup) return;

      const video = source.video;
      if (!video || video.readyState < 2) {
        p.background(canvas.background);
        p.fill(100);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text('Click "Upload Video" or "Open Camera"', canvas.width / 2, canvas.height / 2);
        return;
      }

      const perfRes = getPerformanceResolution();
      frameCtx.drawImage(video, 0, 0, perfRes.width, perfRes.height);
      const frameData = frameCtx.getImageData(0, 0, perfRes.width, perfRes.height);

      const rawBlobs = motionDetector.detect(frameData);
      
      const blobs = rawBlobs.map(blob => ({
        ...blob,
        x: blob.x * (canvas.width / perfRes.width),
        y: blob.y * (canvas.height / perfRes.height),
        bounds: {
          x: blob.bounds.x * (canvas.width / perfRes.width),
          y: blob.bounds.y * (canvas.height / perfRes.height),
          w: blob.bounds.w * (canvas.width / perfRes.width),
          h: blob.bounds.h * (canvas.height / perfRes.height),
        }
      }));

      p.background(canvas.background);

      if (motion.showVideo) {
        videoBuffer.drawingContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        p.image(videoBuffer, 0, 0);
      }

      effectRenderer.render(p, blobs);
    };

    p.windowResized = () => {};
  };

  function handleExport(p, format = 'webm') {
    if (format === 'webm') {
      toggleVideoRecording(p);
      return;
    }

    setStatus('Exporting…');

    p.saveCanvas('track-export', 'png');

    setStatus('Done!');
    setTimeout(() => setStatus('Ready'), 2000);
  }

  function toggleVideoRecording(p) {
    if (isRecording) {
      mediaRecorder?.stop();
      return;
    }

    if (!MediaRecorder.isTypeSupported('video/webm')) {
      alert('WebM recording is not supported in this browser.');
      return;
    }

    const stream = p.canvas.captureStream(30);
    const bitrate = exportSettings.highQuality ? 10_000_000 : 5_000_000;
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: bitrate,
    });
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `track-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      isRecording = false;
      setStatus('Video saved!');
      setTimeout(() => setStatus('Ready'), 2000);
    };

    mediaRecorder.start();
    isRecording = true;
    setStatus('Recording… click Export WebM to stop');
  }

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    get uiInstance() { return uiInstance; },
    handleFile: (file) => {
      if (file.type.startsWith('video/')) {
        loadVideoFile(file, (video) => {
          const size = { width: video.videoWidth, height: video.videoHeight };
          const aspect = size.width / size.height;
          
          if (aspect > 1) {
            canvas.aspectRatio = '16:9';
          } else {
            canvas.aspectRatio = '9:16';
          }
          updateCanvasSize();
          p5Instance.resizeCanvas(canvas.width, canvas.height);
          videoBuffer.setSize(canvas.width, canvas.height);
          
          const perfRes = getPerformanceResolution();
          frameCanvas.width = perfRes.width;
          frameCanvas.height = perfRes.height;
          motionDetector.resize(perfRes.width, perfRes.height);
          effectRenderer.resize(canvas.width, canvas.height);
          
          video.playbackRate = source.playbackSpeed;
          refreshUI();
        });
      }
    },
    dispose: () => {
      stopVideo();
      motionDetector?.dispose();
      effectRenderer?.dispose();
      if (uiInstance && uiInstance.dispose) {
        uiInstance.dispose();
      }
    }
  };
}
