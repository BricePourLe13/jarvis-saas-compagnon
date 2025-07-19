// Générateur de NEXTAUTH_SECRET sécurisé
const crypto = require('crypto');

console.log('🔐 GÉNÉRATEUR NEXTAUTH_SECRET SÉCURISÉ\n');

// Génération d'un secret cryptographiquement sûr
const secret = crypto.randomBytes(32).toString('hex');

console.log('🎯 NEXTAUTH_SECRET à utiliser dans Vercel:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📋 ÉTAPES POUR CORRIGER:');
console.log('1. Aller sur: https://vercel.com/bricepourle13/jarvis-saas-compagnon/settings/environment-variables');
console.log('2. Modifier la variable NEXTAUTH_SECRET');
console.log('3. Remplacer "generate_32_random_chars" par la valeur ci-dessus');
console.log('4. Sauvegarder → Redéploiement automatique');

console.log('\n🔍 VÉRIFICATION:');
console.log(`- Longueur: ${secret.length} caractères ✅`);
console.log(`- Format: Hexadécimal ✅`);
console.log(`- Entropie: ${secret.length * 4} bits ✅`);
console.log(`- Sécurité: Cryptographiquement sûr ✅`);

console.log('\n⚠️ IMPORTANT:');
console.log('- NE PAS partager ce secret');
console.log('- Utiliser uniquement dans Vercel');
console.log('- Redémarrage automatique après modification');

// Génération de quelques alternatives
console.log('\n🔄 ALTERNATIVES (au cas où):');
for (let i = 1; i <= 3; i++) {
    const altSecret = crypto.randomBytes(32).toString('hex');
    console.log(`${i}. ${altSecret}`);
}

console.log('\n✅ Secret généré avec succès!');
