// src/content.js
const BANNER_ID = 'anti-phish-banner-v1';

console.log('Anti-Phish: content script loaded on', location.href);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Anti-Phish: content received message', message);
  if (message?.action === 'showWarning') {
    displayWarning(message.reason || '');
    sendResponse({ ok: true });
  } else if (message?.action === 'clearWarning') {
    removeWarning();
    sendResponse({ ok: true });
  }
});

// Display a persistent banner at top of page
function displayWarning(reason) {
  if (document.getElementById(BANNER_ID)) return;

  const warning = document.createElement('div');
  warning.id = BANNER_ID;
  Object.assign(warning.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    backgroundColor: '#b00020',
    color: '#fff',
    padding: '12px',
    zIndex: '2147483647',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  });
  const text = document.createElement('span');
  text.textContent = `Anti-Phish: This site looks suspicious${reason ? ' — ' + reason : ''}`;
  const btn = document.createElement('button');
  btn.textContent = 'Dismiss';
  btn.style.cursor = 'pointer';
  btn.style.background = 'rgba(255,255,255,0.12)';
  btn.style.border = 'none';
  btn.style.color = 'white';
  btn.style.padding = '6px 8px';
  btn.onclick = () => warning.remove();

  warning.appendChild(text);
  warning.appendChild(btn);
  document.documentElement.insertBefore(warning, document.documentElement.firstChild);

  // Auto-hide after 30s
  setTimeout(() => warning.remove(), 30000);
}

function removeWarning() {
  const el = document.getElementById(BANNER_ID);
  if (el) el.remove();
}
