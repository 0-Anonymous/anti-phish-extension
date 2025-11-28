// scripts/validate-manifest.js
const fs = require('fs');
const path = require('path');

const file = path.resolve(process.cwd(), 'manifest.json');
if (!fs.existsSync(file)) {
  console.error('manifest.json not found at repo root.');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!data.manifest_version || !data.name || !data.version) {
  console.error('manifest.json missing required keys.');
  process.exit(1);
}
console.log('manifest.json looks OK.');
process.exit(0);
