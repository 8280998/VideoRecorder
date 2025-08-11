// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const stopBtn = document.getElementById('stop');
  const qualitySelect = document.getElementById('quality');

  let isPaused = false;

  // Query storage for current state on load
  chrome.storage.local.get(['recording', 'paused'], (data) => {
    if (data.recording) {
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      isPaused = data.paused || false;
      pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'recording-started') {
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      pauseBtn.textContent = 'Pause';
      isPaused = false;
    } else if (message.action === 'recording-stopped') {
      resetButtons();
    } else if (message.action === 'recording-paused') {
      isPaused = true;
      pauseBtn.textContent = 'Resume';
    } else if (message.action === 'recording-resumed') {
      isPaused = false;
      pauseBtn.textContent = 'Pause';
    }
  });

  startBtn.addEventListener('click', () => {
    const quality = qualitySelect.value;
    chrome.runtime.sendMessage({ action: 'start-recording', quality });
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    chrome.runtime.sendMessage({ action: isPaused ? 'pause-recording' : 'resume-recording' });
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop-recording' });
  });

  function resetButtons() {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    isPaused = false;
  }
});