// Test rapide de l'API Vercel et de l'app
const https = require('https');
const http = require('http');

console.log('🚀 DIAGNOSTIC RAPIDE JARVIS SaaS\n');

// Test 1: Health Check
function testHealthCheck() {
    return new Promise((resolve) => {
        console.log('1️⃣ Test Health Check...');
        const req = https.get('https://jarvis-saas-compagnon.vercel.app/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
                if (data) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
                    } catch (e) {
                        console.log(`   Raw Response: ${data.substring(0, 200)}...`);
                    }
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(5000, () => {
            console.log('   ⏰ Timeout 5s');
            req.destroy();
            resolve();
        });
    });
}

// Test 2: App principale
function testMainApp() {
    return new Promise((resolve) => {
        console.log('\n2️⃣ Test App Principale...');
        const req = https.get('https://jarvis-saas-compagnon.vercel.app/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log('   ✅ App accessible');
                } else if (res.statusCode === 302 || res.statusCode === 301) {
                    console.log(`   🔄 Redirection vers: ${res.headers.location}`);
                } else {
                    console.log('   ❌ Problème détecté');
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(5000, () => {
            console.log('   ⏰ Timeout 5s');
            req.destroy();
            resolve();
        });
    });
}

// Test 3: Vercel API (si token disponible)
function testVercelAPI() {
    return new Promise((resolve) => {
        console.log('\n3️⃣ Test Vercel API...');
        const options = {
            hostname: 'api.vercel.com',
            path: '/v9/projects',
            headers: {
                'Authorization': 'Bearer mMVrFl7nGgVBomJGVEbqsv4U'
            }
        };
        
        const req = https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   ✅ API accessible - ${json.projects?.length || 0} projets`);
                    } catch (e) {
                        console.log('   ✅ API accessible (parsing error)');
                    }
                } else {
                    console.log('   ❌ Problème API Vercel');
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(5000, () => {
            console.log('   ⏰ Timeout 5s');
            req.destroy();
            resolve();
        });
    });
}

// Exécution séquentielle
async function runDiagnostic() {
    await testHealthCheck();
    await testMainApp();
    await testVercelAPI();
    
    console.log('\n🏁 DIAGNOSTIC TERMINÉ');
    console.log('\n📋 RÉSUMÉ:');
    console.log('- Si Status 200 partout → ✅ Infrastructure OK');
    console.log('- Si 404/502 → ❌ Variables manquantes ou build failed');
    console.log('- Si redirection → 🔄 Auth/Config problem');
    console.log('\n🔗 URL: https://jarvis-saas-compagnon.vercel.app');
}

runDiagnostic();
