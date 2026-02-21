// ============================================================
// Media Handling - Webcam & Video File
// ============================================================

import { source } from './state.js';

export async function startWebcam(onStream, onError) {
  try {
    if (source.stream) {
      stopWebcam();
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });
    
    source.stream = stream;
    source.type = 'webcam';
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    
    await video.play();
    
    source.video = video;
    
    if (onStream) onStream(video, stream);
    
    return video;
  } catch (err) {
    console.error('Webcam error:', err);
    if (onError) onError(err);
    return null;
  }
}

export function stopWebcam() {
  if (source.stream) {
    source.stream.getTracks().forEach(track => track.stop());
    source.stream = null;
  }
  
  if (source.video) {
    source.video.pause();
    source.video.srcObject = null;
    if (source.video.parentNode) {
      source.video.parentNode.removeChild(source.video);
    }
    source.video = null;
  }
  
  source.type = 'none';
}

export function loadVideoFile(file, onLoaded, onError) {
  if (source.video) {
    if (source.stream) {
      stopWebcam();
    } else {
      source.video.pause();
      if (source.video.parentNode) {
        source.video.parentNode.removeChild(source.video);
      }
      source.video = null;
    }
  }
  
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);
  
  source.fileName = file.name;
  
  video.addEventListener('loadeddata', async () => {
    await video.play();
    source.video = video;
    source.type = 'file';
    source.stream = null;
    
    if (onLoaded) onLoaded(video);
  }, { once: true });
  
  video.addEventListener('error', (err) => {
    URL.revokeObjectURL(url);
    console.error('Video load error:', err);
    if (onError) onError(err);
  }, { once: true });
  
  video.load();
}

export function stopVideo() {
  if (source.stream) {
    stopWebcam();
    return;
  }
  
  if (source.video) {
    source.video.pause();
    URL.revokeObjectURL(source.video.src);
    if (source.video.parentNode) {
      source.video.parentNode.removeChild(source.video);
    }
    source.video = null;
  }
  
  source.type = 'none';
  source.fileName = '';
}

export function getVideoFrame(video, canvas, ctx) {
  if (!video || video.readyState < 2) return null;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function isVideoReady() {
  return source.video && source.video.readyState >= 2;
}

export function getVideoSize() {
  if (!source.video) return { width: 640, height: 480 };
  return {
    width: source.video.videoWidth || 640,
    height: source.video.videoHeight || 480
  };
}
