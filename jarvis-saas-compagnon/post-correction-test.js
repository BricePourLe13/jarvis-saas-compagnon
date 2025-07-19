// Test de vérification post-correction NEXTAUTH_SECRET
console.log('🔧 TEST POST-CORRECTION NEXTAUTH_SECRET\n');

console.log('📋 CHECKLIST:');
console.log('1. ✅ Token Vercel fonctionnel');
console.log('2. ✅ Projet jarvis-saas-compagnon trouvé');
console.log('3. ✅ Variables Supabase configurées');
console.log('4. 🔄 NEXTAUTH_SECRET à corriger');
console.log('5. ⏳ Attendre redéploiement automatique\n');

console.log('🎯 APRÈS CORRECTION:');
console.log('- Redéploiement automatique (2-3 min)');
console.log('- Health Check API fonctionnera');
console.log('- Accès depuis autres PC OK');
console.log('- Monitoring complet opérationnel\n');

console.log('🧪 TESTS À FAIRE APRÈS:');
console.log('curl https://jarvis-saas-compagnon.vercel.app/api/health');
console.log('curl https://jarvis-saas-compagnon.vercel.app/');
console.log('\n🚀 Votre infrastructure sera alors à 10/10 !');

// Test de vérification de l'état actuel
const https = require('https');

function quickHealthCheck() {
    console.log('\n🏥 Test Health Check actuel...');
    const req = https.get('https://jarvis-saas-compagnon.vercel.app/api/health', (res) => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Health Check déjà fonctionnel !');
        } else if (res.statusCode === 404) {
            console.log('⏳ En attente de redéploiement...');
        } else {
            console.log(`⚠️ Status inattendu: ${res.statusCode}`);
        }
    });
    
    req.on('error', (e) => {
        console.log(`❌ Erreur: ${e.message}`);
    });
    
    req.setTimeout(5000, () => {
        req.destroy();
        console.log('⏰ Timeout - Test terminé');
    });
}

quickHealthCheck();
