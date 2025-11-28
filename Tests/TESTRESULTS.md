# Test Results — Anti-Phish

**Date:** YYYY-MM-DD  
**Tested by:** YOUR NAME  
**Browser:** e.g. Chrome  (version)  
**Extension build / commit:** commit-hash or v1.0.0

---

## Manual test server
`demo/run-demo.sh` used? (yes/no): __

## Test cases

| # | Test case | URL / page | Expected behavior | Actual behavior | Pass/Fail | Notes |
|---|-----------|------------|-------------------|-----------------|----------:|-------|
| 1 | Demo phishing page (password form) | demo/phishing-sample.html | Banner should appear |  |  |  |
| 2 | Known blocklist domain | example-phish.com (or local mapping) | Banner should appear |  |  |  |
| 3 | Suspicious hostname (e.g., "secure-login.example.com") | secure-login.example.com | Banner should appear |  |  |  |
| 4 | Normal safe site (e.g., example.com) | https://example.com | No banner |  |  |  |
| 5 | Popup scan button | (active tab) | Scans and reports status |  |  |  |
| 6 | Dismiss banner | (where banner displayed) | Banner removed on dismiss |  |  |  |

---

## Summary & notes
- Total tests: N
- Passed: X
- Failed: Y
- Known issues / next steps:
  - e.g. refine host-matching rules, avoid false positives on subdomains, add allowlist UI.
