#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour corriger les any et entités JSX dans un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Corrections des any
    const anyReplacements = [
      // Paramètres et variables
      [/: any\b/g, ': unknown'],
      [/= any\b/g, '= unknown'],
      [/\(.*: any\)/g, (match) => match.replace(': any', ': unknown')],
      [/Record<string, any>/g, 'Record<string, unknown>'],
      [/Array<any>/g, 'Array<unknown>'],
      [/any\[\]/g, 'unknown[]'],
      
      // Catch clauses
      [/catch \(([^:]*): any\)/g, 'catch ($1: unknown)'],
      [/catch\(([^:]*): any\)/g, 'catch($1: unknown)'],
      
      // Function parameters
      [/\(([^)]*): any([^)]*)\)/g, (match, p1, p2) => {
        return match.replace(': any', ': unknown');
      }],
      
      // Variable declarations
      [/let ([^:=]*): any/g, 'let $1: unknown'],
      [/const ([^:=]*): any/g, 'const $1: unknown'],
      [/var ([^:=]*): any/g, 'var $1: unknown'],
    ];

    anyReplacements.forEach(([regex, replacement]) => {
      const newContent = content.replace(regex, replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });

    // Corrections des entités JSX
    const jsxReplacements = [
      // Apostrophes
      [/([^&])'([^&;])/g, "$1&apos;$2"],
      [/^'([^&;])/gm, "&apos;$1"],
      [/([^&])'$/gm, "$1&apos;"],
      
      // Guillemets doubles dans le JSX (éviter les attributs)
      [/>"([^"]*)"</g, '>&quot;$1&quot;<'],
      [/>\s*"([^"]*)"([^<]*)</g, '> &quot;$1&quot;$2<'],
    ];

    // Seulement pour les fichiers .tsx
    if (filePath.endsWith('.tsx')) {
      jsxReplacements.forEach(([regex, replacement]) => {
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });
    }

    // Corrections spéciales pour les let/const
    content = content.replace(/let ([^=]*) = ([^=]*any[^=]*)/g, (match, varName, value) => {
      if (!varName.includes(':')) {
        return `const ${varName} = ${value}`;
      }
      return match;
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les dossiers
function fixDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let totalFixed = 0;

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Ignorer node_modules et .next
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
        continue;
      }
      totalFixed += fixDirectory(fullPath);
    } else if (entry.isFile()) {
      // Traiter les fichiers .ts et .tsx
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        if (fixFile(fullPath)) {
          totalFixed++;
        }
      }
    }
  }

  return totalFixed;
}

// Script principal
console.log('🔧 Fixing TypeScript errors in project...');
const totalFixed = fixDirectory('./src');
console.log(`\n✨ Fixed ${totalFixed} files total.`);