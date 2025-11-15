const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src');
const suspects = [];

function processFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const trimmed = text.trimEnd();
  if (trimmed.length < 2000) return;

  const chunkLength = Math.min(4000, Math.floor(trimmed.length / 2));
  if (chunkLength < 500) return;

  const tail = trimmed.slice(trimmed.length - chunkLength);
  const idx = trimmed.indexOf(tail);
  if (idx !== -1 && idx < trimmed.length - chunkLength) {
    suspects.push(filePath);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      processFile(full);
    }
  }
}

walk(root);
console.log(`Tail duplicate suspects: ${suspects.length}`);
suspects.forEach((file) => console.log(path.relative(process.cwd(), file)));
