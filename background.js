// background.js
let isRecording = false;
let isPaused = false;
const qualityMap = {
  low: 500000,
  medium: 2500000,
  high: 5000000
};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'start-recording') {
    await startRecording(message.quality);
  } else if (message.action === 'pause-recording') {
    chrome.runtime.sendMessage({ action: 'pause-offscreen' });
    isPaused = true;
    chrome.storage.local.set({ paused: true });
    chrome.runtime.sendMessage({ action: 'recording-paused' });
  } else if (message.action === 'resume-recording') {
    chrome.runtime.sendMessage({ action: 'resume-offscreen' });
    isPaused = false;
    chrome.storage.local.set({ paused: false });
    chrome.runtime.sendMessage({ action: 'recording-resumed' });
  } else if (message.action === 'stop-recording') {
    stopRecording();
  } else if (message.action === 'download') {
    chrome.downloads.download({
      url: message.url,
      filename: 'recording.mp4',
      saveAs: true
    });
    isRecording = false;
    isPaused = false;
    chrome.storage.local.remove(['recording', 'paused']);
    chrome.runtime.sendMessage({ action: 'recording-stopped' });
    // Optionally close the offscreen document
    // chrome.offscreen.closeDocument();
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'start-recording') {
    chrome.storage.local.get('quality', async (data) => {
      const quality = data.quality || 'medium';
      await startRecording(quality);
    });
  } else if (command === 'pause-recording') {
    if (isRecording) {
      if (isPaused) {
        chrome.runtime.sendMessage({ action: 'resume-offscreen' });
        isPaused = false;
        chrome.storage.local.set({ paused: false });
        chrome.runtime.sendMessage({ action: 'recording-resumed' });
      } else {
        chrome.runtime.sendMessage({ action: 'pause-offscreen' });
        isPaused = true;
        chrome.storage.local.set({ paused: true });
        chrome.runtime.sendMessage({ action: 'recording-paused' });
      }
    }
  } else if (command === 'stop-recording') {
    if (isRecording) {
      stopRecording();
    }
  }
});

async function createOffscreen() {
  if (await chrome.offscreen.hasDocument?.()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA', 'BLOBS'],
    justification: 'Record tab audio and video, and handle blobs'
  });
}

async function startRecording(quality) {
  if (isRecording) return;
  await createOffscreen();
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tabId = tabs[0].id;
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });
    const bitrate = qualityMap[quality];
    chrome.runtime.sendMessage({ action: 'start-offscreen', streamId, bitrate });
    isRecording = true;
    chrome.storage.local.set({ recording: true, paused: false });
    chrome.runtime.sendMessage({ action: 'recording-started' });
  });
}

function stopRecording() {
  chrome.runtime.sendMessage({ action: 'stop-offscreen' });
}