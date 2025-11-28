// src/background.js
console.log('Anti-Phish: background service worker starting');

const DEFAULT_BLOCKLIST = ["example-phish.com", "malicious-example.org"];
const SUSPICIOUS_KEYWORDS = ["login-", "secure-", "account-", "verify-", "update-"];

// Return true if the URL scheme is one where we can inject/run scripts
function isInjectableUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // trim whitespace
  url = url.trim();

  // common allowed schemes
  if (url.startsWith('http://') || url.startsWith('https://')) return true;

  // optional: allow file:// when extension has permission and "Allow access to file URLs" is enabled
  if (url.startsWith('file://')) return true;

  // chrome-extension pages are usually not injectable (skip)
  // chrome://, devtools://, about:, etc -> not allowed
  return false;
}

async function getBlocklist() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ blocklist: DEFAULT_BLOCKLIST }, (items) => {
      resolve(items.blocklist || DEFAULT_BLOCKLIST);
    });
  });
}

function hostnameFromUrl(url) {
  try {
    // Use URL only for http/https schemes; for file:// return empty string
    if (url.startsWith('file://')) return '';
    const u = new URL(url);
    return u.hostname.toLowerCase();
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

async function pageHasCredentialForm(tabId, url) {
  // If URL is not injectable, skip running page checks
  if (!isInjectableUrl(url)) {
    console.log(`Anti-Phish: skipping page form checks for non-injectable URL: ${url}`);
    return false;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // run inside the page
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
    // log and return false (do not rethrow)
    console.warn('Anti-Phish: pageHasCredentialForm error', e && e.message ? e.message : e);
  }
  return false;
}

async function showWarning(tabId, reason) {
  // only send message if tab is injectable (content script can accept it)
  try {
    chrome.tabs.get(tabId, async (tab) => {
      if (!tab) return;
      if (!isInjectableUrl(tab.url)) {
        // fallback: we can't inject into this page; just log
        console.log(`Anti-Phish: cannot inject warning into disallowed URL: ${tab.url}`);
        return;
      }

      // prefer messaging existing content script
      chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, (resp) => {
        if (chrome.runtime.lastError) {
          // if messaging fails (no content script), try injecting content.js then message
          console.warn('Anti-Phish: sendMessage failed, will attempt injection', chrome.runtime.lastError.message);
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['src/content.js']
          }).then(() => {
            chrome.tabs.sendMessage(tabId, { action: 'showWarning', reason }, () => {});
          }).catch((err) => {
            console.error('Anti-Phish: fallback injection failed', err);
          });
        } else {
          console.log(`Anti-Phish: sent showWarning to tab ${tabId} (${reason})`);
        }
      });
    });
  } catch (e) {
    console.error('Anti-Phish: showWarning error', e);
  }
}

async function runChecks(tabId, url) {
  try {
    console.log(`Anti-Phish: running checks for tab ${tabId} url=${url}`);
    // If URL is not injectable, we still can do URL-only analysis
    const analysis = await analyzeUrl(url);
    if (analysis.hit) {
      await showWarning(tabId, analysis.reason);
      return;
    }

    // If the page is injectable, run DOM checks as well
    const credential = await pageHasCredentialForm(tabId, url);
    if (credential) {
      await showWarning(tabId, 'contains credential form');
      return;
    }

    console.log(`Anti-Phish: no issues found for tab ${tabId}`);
  } catch (e) {
    console.error('Anti-Phish: runChecks error', e);
  }
}

// Run checks when a tab finishes loading (only for allowed URLs)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status !== 'complete' || !tab?.url) return;

    // skip internal pages early
    if (!isInjectableUrl(tab.url)) {
      // still run URL-only analysis for http(s)/file behavior already handled in isInjectableUrl
      // but we don't try any DOM injection
      console.log(`Anti-Phish: tab updated with non-injectable URL, skipping DOM checks: ${tab.url}`);
      // still analyze URL if it has a host
      analyzeUrl(tab.url).then((analysis) => {
        if (analysis.hit) showWarning(tabId, analysis.reason).catch(console.error);
      }).catch(console.error);
      return;
    }

    runChecks(tabId, tab.url).catch(console.error);
  } catch (e) {
    console.error('Anti-Phish: onUpdated handler error', e);
  }
});

// Manual scan handler — queries active tab (works when message comes from popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('background: received message', message, 'sender=', sender);
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
    return true; // keep sendResponse alive
  }
});

