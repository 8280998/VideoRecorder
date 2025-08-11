// offscreen.js
let mediaRecorder;
let recordedChunks = [];
let stream;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'start-offscreen') {
    startRecording(message.streamId, message.bitrate);
  } else if (message.action === 'pause-offscreen') {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
  } else if (message.action === 'resume-offscreen') {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  } else if (message.action === 'stop-offscreen') {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  }
});

async function startRecording(streamId, bitrate) {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
        maxWidth: 1920,  // 设置最大宽度（调整为你想要的值）
        maxHeight: 1080, // 设置最大高度（调整为你想要的值）
        minWidth: 1920,  // 可选：设置最小宽度以强制固定分辨率
        minHeight: 1080  // 可选：设置最小高度以强制固定分辨率
      }
    }
  });

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    videoBitsPerSecond: bitrate
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    chrome.runtime.sendMessage({ action: 'download', url });
    recordedChunks = [];
    stream.getTracks().forEach(track => track.stop());
    mediaRecorder = null;
    stream = null;
  };

  mediaRecorder.start(1000); // Collect data every second
}
