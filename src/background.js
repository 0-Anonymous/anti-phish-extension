// src/background.js

// Default blocklist & heuristics (you can extend from storage)
const DEFAULT_BLOCKLIST = ["example-phish.com", "malicious-example.org"];
const SUSPICIOUS_KEYWORDS = ["login-", "secure-", "account-", "verify-", "update-"];

// Load blocklist from storage
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

// Heuristic check
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

// Check page for credential form by running a small content function
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
    console.error('pageHasCredentialForm error', e);
  }
  return false;
}

async function runChecks(tabId, url) {
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
}

// Send message to the content script to show warning
async function showWarning(tabId, reason) {
  try {
    // ensure content script exists in that tab by executing a no-op script first
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => true
    });

    chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, () => {});
  } catch (e) {
    // If we can't execute script, try injecting content.js and then message
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content.js']
      });
      chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, () => {});
    } catch (err) {
      console.error('showWarning error', err);
    }
  }
}

// Listen to tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;
  runChecks(tabId, tab.url).catch(console.error);
});

// Manual scan from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'manualScan' && message?.url && sender?.tab?.id) {
    runChecks(sender.tab.id, message.url).then(() => {
      sendResponse({ ok: true });
    }).catch((err) => {
      console.error(err);
      sendResponse({ ok: false, error: err?.message });
    });
    // indicate async response
    return true;
  }
});
