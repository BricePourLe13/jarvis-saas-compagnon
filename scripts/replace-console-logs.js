/**
 * Script pour remplacer console.log/warn/error/debug par logger
 * 
 * Usage: node scripts/replace-console-logs.js <directory>
 */

const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/app/api/voice',
  'src/app/api/jarvis',
  'src/app/api/kiosk',
  'src/components/kiosk',
  'src/lib/voice'
];

const replacements = [
  // console.log() → logger.info()
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info('
  },
  // console.warn() → logger.warn()
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn('
  },
  // console.error() → logger.error()
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error('
  },
  // console.debug() → logger.debug()
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug('
  }
];

function addLoggerImport(content, filePath) {
  // Vérifier si l'import existe déjà
  if (content.includes('from \'@/lib/production-logger\'')) {
    return content;
  }

  // Trouver la position après les derniers imports
  const importRegex = /^import .+;$/gm;
  let lastImportIndex = 0;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    lastImportIndex = match.index + match[0].length;
  }

  // Insérer l'import après le dernier import existant
  if (lastImportIndex > 0) {
    const before = content.substring(0, lastImportIndex);
    const after = content.substring(lastImportIndex);
    return before + '\nimport { logger } from \'@/lib/production-logger\';' + after;
  }

  // Si pas d'imports, ajouter au début après les commentaires
  const lines = content.split('\n');
  let insertIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('/**') && !line.startsWith('*') && !line.startsWith('//') && !line.startsWith('*/')) {
      insertIndex = i;
      break;
    }
  }

  lines.splice(insertIndex, 0, 'import { logger } from \'@/lib/production-logger\';');
  return lines.join('\n');
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Appliquer tous les remplacements
    for (const { pattern, replacement } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    }

    // Si on a fait des remplacements, ajouter l'import du logger
    if (hasChanges) {
      content = addLoggerImport(content, filePath);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  let filesProcessed = 0;
  
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        filesProcessed += processDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        if (processFile(fullPath)) {
          filesProcessed++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }

  return filesProcessed;
}

function main() {
  console.log('🔧 Remplacement console.log → logger');
  console.log('==================================\n');

  let totalFiles = 0;

  for (const dir of targetDirs) {
    const fullPath = path.join(process.cwd(), dir);
    console.log(`📁 Processing: ${dir}`);
    
    if (fs.existsSync(fullPath)) {
      const count = processDirectory(fullPath);
      totalFiles += count;
      console.log(`   ✅ ${count} fichiers modifiés\n`);
    } else {
      console.log(`   ⚠️  Directory not found\n`);
    }
  }

  console.log('==================================');
  console.log(`🎉 Total: ${totalFiles} fichiers modifiés`);
}

main();

