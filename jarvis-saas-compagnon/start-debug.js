const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de JARVIS SaaS Compagnon...');
console.log('📂 Répertoire:', process.cwd());

// Vérification des fichiers critiques
const fs = require('fs');
const criticalFiles = [
  'package.json',
  'next.config.js',
  'postcss.config.mjs',
  'tailwind.config.js',
  '.env.local'
];

console.log('\n🔍 Vérification des fichiers...');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Démarrage de Next.js
console.log('\n🔥 Lancement du serveur Next.js...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (error) => {
  console.error('❌ Erreur:', error);
});

nextProcess.on('close', (code) => {
  console.log(`🏁 Processus terminé avec le code ${code}`);
});
