// src/popup.js
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scan');
  const reportBtn = document.getElementById('report');
  const status = document.getElementById('status');

  function setStatus(text) {
    if (status) status.textContent = `Status: ${text}`;
    console.log('popup:', text);
  }

  scanBtn.addEventListener('click', async () => {
    setStatus('scanning...');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('popup: active tab', tab);
      if (!tab || !tab.id) {
        setStatus('no active tab');
        return;
      }
      chrome.runtime.sendMessage({ action: 'manualScan' }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error('popup: runtime.lastError', chrome.runtime.lastError.message);
          setStatus('error sending scan');
          return;
        }
        console.log('popup: manualScan response', resp);
        if (resp && resp.ok) setStatus('scan completed');
        else setStatus('scan failed');
      });
    } catch (err) {
      console.error('popup: scan handler error', err);
      setStatus('error');
    }
  });

  reportBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/0-Anonymous/anti-phish-extension/issues/new' });
    setStatus('report opened');
  });

  setStatus('Idle');
});
