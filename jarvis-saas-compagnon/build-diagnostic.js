// Test direct de compilation TypeScript et Next.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 DIAGNOSTIC BUILD JARVIS SaaS\n');

const projectPath = process.cwd();
console.log(`📁 Projet: ${projectPath}`);

// 1. Vérification des fichiers critiques
console.log('\n1️⃣ Vérification des fichiers...');
const criticalFiles = [
    'src/app/api/health/route.ts',
    'src/lib/rate-limiter.ts',
    'package.json',
    'next.config.js'
];

criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(projectPath, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Test TypeScript
console.log('\n2️⃣ Test TypeScript...');
try {
    execSync('npx tsc --noEmit', { encoding: 'utf8', timeout: 30000 });
    console.log('   ✅ TypeScript OK');
} catch (error) {
    console.log('   ❌ Erreurs TypeScript:');
    console.log(error.stdout);
}

// 3. Test Next.js
console.log('\n3️⃣ Test Next.js Build...');
try {
    const output = execSync('npx next build', { 
        encoding: 'utf8', 
        timeout: 60000,
        maxBuffer: 1024 * 1024 // 1MB buffer
    });
    console.log('   ✅ Build Next.js OK');
    console.log('   Détails:', output.split('\n').slice(-10).join('\n'));
} catch (error) {
    console.log('   ❌ Erreur Build Next.js:');
    console.log('   STDOUT:', error.stdout);
    console.log('   STDERR:', error.stderr);
}

// 4. Variables d'environnement
console.log('\n4️⃣ Variables d\'environnement...');
const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
];

envVars.forEach(varName => {
    const exists = process.env[varName] ? '✅' : '❌';
    const value = process.env[varName] ? 
        (varName.includes('SECRET') ? '[MASQUÉ]' : process.env[varName].substring(0, 30) + '...') :
        'MANQUANT';
    console.log(`   ${exists} ${varName}: ${value}`);
});

console.log('\n🏁 DIAGNOSTIC BUILD TERMINÉ');
