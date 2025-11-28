// src/popup.js
(async () => {
  const scanBtn = document.getElementById('scan');
  const reportBtn = document.getElementById('report');
  const status = document.getElementById('status');

  scanBtn.addEventListener('click', async () => {
    status.textContent = 'Status: scanning...';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      status.textContent = 'Status: no active tab';
      return;
    }
    chrome.runtime.sendMessage({ action: 'manualScan', url: tab.url }, (resp) => {
      if (resp?.ok) status.textContent = 'Status: scan completed';
      else status.textContent = 'Status: scan failed';
    });
  });

  reportBtn.addEventListener('click', async () => {
    // open issues link for this repo
    const url = 'https://github.com/0-Anonymous/anti-phish-extension/issues/new';
    chrome.tabs.create({ url });
  });
})();
