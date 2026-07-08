#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const src = path.resolve('dist/opencode-plugin/index.js');
const destDir = path.join(os.homedir(), '.config', 'opencode', 'plugins');
const dest = path.join(destDir, 'opencode-mem.js');

if (!fs.existsSync(src)) {
  console.error(`Missing build: ${src}. Run \`npm run build\` first.`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Synced: ${src} -> ${dest}`);
