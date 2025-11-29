# Privacy Policy — Anti-Phish Browser Extension

_Last updated: {{29/11/25}}_

Thank you for using the **Anti-Phish Extension**.  
Your privacy is extremely important to us. This extension is designed with a strict **privacy-first architecture**.  
This document explains what data is collected, how it is used, and what permissions the extension requires.

---

## 📌 Summary
- ❌ We **do not collect** any personal data.  
- ❌ We **do not store** any data.  
- ❌ We **do not transmit** any data to any server.  
- ❌ We **do not use** analytics, cookies, or tracking.  
- ✔ All phishing detection happens **locally inside your browser**.

---

## 📁 Data We Collect
We collect **no data of any kind**.

The extension does **not** log, transmit, store, or share:
- Personal information  
- Browsing activity  
- Form inputs (emails, passwords, etc.)  
- IP address or device information  
- Cookies or site data  
- Usage statistics  

Because all processing occurs locally, **no information ever leaves your device.**

---

## 🧠 How the Extension Works
Anti-Phish uses a client-side detection engine to identify phishing patterns within the DOM of the currently active web page.

- The extension temporarily reads page content **only to check for phishing indicators**.  
- This analysis happens **in-memory** (RAM only).  
- No content is stored or uploaded anywhere.  

After scanning, the data is immediately discarded.

---

## 🔐 Permissions Used & Why

### `activeTab`
Allows analysis only on the page the user interacts with, for the purpose of detecting phishing signs.

### `scripting` / content scripts
Used strictly to scan the DOM for malicious elements such as:
- fake login forms  
- spoofed input fields  
- credential-stealing scripts  
- suspicious URLs  

The extension **never** collects or transmits the page content it analyzes.

### `storage` (if used)
Only for storing small configuration values (e.g., banner dismiss preference).  
No personal data or browsing history is stored.

---

## 🌍 Data Sharing
We do **not** share any data because we do **not collect any data**.

No external servers, APIs, analytics services, or third-party libraries receive information from this extension.

---

## 👤 Children’s Privacy
The extension does not target or collect information from children under 13.  
In fact, it does not collect information from any user at all.

---

## 🔄 Updates to This Policy
This privacy policy may be updated if new features are added.  
If updated, the new version will be published at the same GitHub URL.

---

## 📬 Contact
If you have questions, feedback, or concerns, please open an issue on GitHub:  
**https://github.com/0-Anonymous/anti-phish-extension/issues**

---

### 🛡 Final Note
Anti-Phish was built with security and privacy as the top priority.  
Your browsing data always stays on your device.

