// src/background.js
console.log('Anti-Phish: background service worker starting');

const DEFAULT_BLOCKLIST = ["example-phish.com", "malicious-example.org"];
const SUSPICIOUS_KEYWORDS = ["login-", "secure-", "account-", "verify-", "update-"];

async function getBlocklist() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ blocklist: DEFAULT_BLOCKLIST }, (items) => {
      resolve(items.blocklist || DEFAULT_BLOCKLIST);
    });
  });
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

async function analyzeUrl(url) {
  const host = hostnameFromUrl(url);
  const blocklist = await getBlocklist();
  if (!host) return { hit: false };

  if (blocklist.includes(host)) return { hit: true, reason: 'blocklist match' };

  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (host.includes(kw)) return { hit: true, reason: `suspicious host pattern (${kw})` };
  }

  if (host.split('.').length >= 4) return { hit: true, reason: 'many subdomains' };

  return { hit: false };
}

async function pageHasCredentialForm(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const hasPassword = !!document.querySelector('input[type="password"]');
        const form = document.querySelector('form');
        return { hasPassword, hasForm: !!form };
      }
    });
    if (results && results[0] && results[0].result) {
      const r = results[0].result;
      return r.hasPassword && r.hasForm;
    }
  } catch (e) {
    console.error('Anti-Phish: pageHasCredentialForm error', e);
  }
  return false;
}

async function showWarning(tabId, reason) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => true
    });

    chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, () => {});
    console.log(`Anti-Phish: sent showWarning to tab ${tabId} (${reason})`);
  } catch (e) {
    console.error('Anti-Phish: showWarning error', e);
    try {
      // fallback: inject content script then message
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content.js']
      });
      chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, () => {});
    } catch (err) {
      console.error('Anti-Phish: fallback injection failed', err);
    }
  }
}

async function runChecks(tabId, url) {
  console.log(`Anti-Phish: running checks for tab ${tabId} url=${url}`);
  const analysis = await analyzeUrl(url);
  if (analysis.hit) {
    await showWarning(tabId, analysis.reason);
    return;
  }

  const credential = await pageHasCredentialForm(tabId);
  if (credential) {
    await showWarning(tabId, 'contains credential form');
    return;
  }

  console.log(`Anti-Phish: no issues found for tab ${tabId}`);
}

// Run checks when a tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;
  runChecks(tabId, tab.url).catch(console.error);
});

// Manual scan handler — queries active tab (works when message comes from popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'manualScan') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ ok: false, error: 'no active tab' });
        return;
      }
      runChecks(tab.id, tab.url).then(() => {
        sendResponse({ ok: true });
      }).catch((err) => {
        console.error('Anti-Phish: manualScan error', err);
        sendResponse({ ok: false, error: err?.message });
      });
    });
    // indicate we will call sendResponse asynchronously
    return true;
  }
});
