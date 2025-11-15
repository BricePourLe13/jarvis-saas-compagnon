const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src');
const modified = [];

function detectAndFix(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const trimmed = original.trimEnd();

  if (trimmed.length < 2000) {
    return;
  }

  const chunkLength = Math.min(4000, Math.floor(trimmed.length / 2));
  if (chunkLength < 500) {
    return;
  }

  const chunk = trimmed.slice(0, chunkLength);
  const duplicateIndex = trimmed.indexOf(chunk, chunkLength);

  if (duplicateIndex !== -1) {
    const cleaned = trimmed.slice(0, duplicateIndex).replace(/\s+$/, '') + '\n';
    fs.writeFileSync(filePath, cleaned, 'utf8');
    modified.push(filePath);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      detectAndFix(full);
    }
  }
}

walk(root);

console.log(`Files trimmed (appended duplicates): ${modified.length}`);
modified.forEach((file) => console.log(path.relative(process.cwd(), file)));
