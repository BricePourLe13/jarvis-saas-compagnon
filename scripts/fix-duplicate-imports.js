const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src');
const cleaned = [];

function isSkippable(trimmed) {
  if (trimmed === '') return true;
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('/*') && !trimmed.includes('*/')) return true;
  if (trimmed === "'use client'" || trimmed === '"use client"') return true;
  if (trimmed === "'use server'" || trimmed === '"use server"') return true;
  if (trimmed.startsWith('*')) return true;
  return false;
}

function truncateAt(lines, index) {
  const result = lines.slice(0, index).join('\n').replace(/\s+$/, '') + '\n';
  return result;
}

function processFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  let pastImports = false;
  let cutIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!pastImports) {
      if (isSkippable(trimmed)) continue;
      if (trimmed.startsWith('import ')) continue;
      pastImports = true;
    } else {
      if (/^import\s/.test(raw)) {
        cutIndex = i;
        break;
      }
    }
  }

  if (cutIndex === -1) {
    const matches = [...text.matchAll(/(^|\n)export default/g)];
    if (matches.length > 1) {
      const second = matches[1].index;
      cutIndex = text.substring(0, second).split(/\r?\n/).length;
    }
  }

  if (cutIndex !== -1) {
    const newText = truncateAt(lines, cutIndex);
    fs.writeFileSync(file, newText);
    cleaned.push(file);
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
console.log(`Cleaned files: ${cleaned.length}`);
cleaned.forEach((file) => console.log(path.relative(process.cwd(), file)));
