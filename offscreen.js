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
        chromeMediaSourceId: streamId
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