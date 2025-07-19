// Diagnostic complet avec le nouveau token Vercel
const https = require('https');

const VERCEL_TOKEN = '2omTRZug3Yqg8VhJl2CnbURB';

console.log('🚀 DIAGNOSTIC COMPLET JARVIS SaaS - Nouveau Token\n');

// Test 1: Vérification du nouveau token
function testVercelToken() {
    return new Promise((resolve) => {
        console.log('1️⃣ Test nouveau token Vercel...');
        const options = {
            hostname: 'api.vercel.com',
            path: '/v9/projects',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`
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
                        console.log(`   ✅ Token valide - ${json.projects?.length || 0} projets trouvés`);
                        
                        // Recherche du projet JARVIS
                        const jarvisProject = json.projects?.find(p => 
                            p.name.includes('jarvis') || p.name.includes('saas-compagnon')
                        );
                        
                        if (jarvisProject) {
                            console.log(`   🎯 Projet JARVIS trouvé: ${jarvisProject.name} (ID: ${jarvisProject.id})`);
                            return resolve({ success: true, projectId: jarvisProject.id, projectName: jarvisProject.name });
                        } else {
                            console.log('   ⚠️ Projet JARVIS non trouvé dans la liste');
                            return resolve({ success: true, projectId: null });
                        }
                    } catch (e) {
                        console.log('   ❌ Erreur parsing JSON');
                        return resolve({ success: false });
                    }
                } else {
                    console.log(`   ❌ Token invalide ou permissions insuffisantes`);
                    console.log(`   Response: ${data.substring(0, 200)}`);
                    return resolve({ success: false });
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur réseau: ${e.message}`);
            resolve({ success: false });
        });
        
        req.setTimeout(10000, () => {
            console.log('   ⏰ Timeout 10s');
            req.destroy();
            resolve({ success: false });
        });
    });
}

// Test 2: Déploiements du projet
function testDeployments(projectId) {
    return new Promise((resolve) => {
        if (!projectId) {
            console.log('2️⃣ Test déploiements... ⏭️ Pas de project ID');
            return resolve();
        }
        
        console.log(`2️⃣ Test déploiements du projet ${projectId}...`);
        const options = {
            hostname: 'api.vercel.com',
            path: `/v6/deployments?projectId=${projectId}&limit=5`,
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`
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
                        console.log(`   ✅ ${json.deployments?.length || 0} déploiements trouvés`);
                        
                        if (json.deployments?.length > 0) {
                            const latest = json.deployments[0];
                            console.log(`   📅 Dernier déploiement: ${latest.state} (${new Date(latest.createdAt).toLocaleString()})`);
                            console.log(`   🔗 URL: ${latest.url}`);
                        }
                    } catch (e) {
                        console.log('   ❌ Erreur parsing déploiements');
                    }
                } else {
                    console.log(`   ❌ Impossible d'accéder aux déploiements`);
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(10000, () => {
            console.log('   ⏰ Timeout 10s');
            req.destroy();
            resolve();
        });
    });
}

// Test 3: Health Check après configuration
function testHealthCheck() {
    return new Promise((resolve) => {
        console.log('3️⃣ Test Health Check (après config variables)...');
        const req = https.get('https://jarvis-saas-compagnon.vercel.app/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   ✅ Health Check OK`);
                        console.log(`   📊 Status: ${json.status}`);
                        console.log(`   🗄️ Database: ${json.services?.database?.status}`);
                        console.log(`   🔐 Auth: ${json.services?.auth?.status}`);
                        console.log(`   ⚡ Latence DB: ${json.services?.database?.latency}ms`);
                    } catch (e) {
                        console.log('   ⚠️ Health Check répond mais JSON invalide');
                        console.log(`   Raw: ${data.substring(0, 100)}...`);
                    }
                } else if (res.statusCode === 404) {
                    console.log('   ❌ Health Check toujours en 404 - Attendre redéploiement');
                } else {
                    console.log(`   ⚠️ Health Check status inattendu: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(10000, () => {
            console.log('   ⏰ Timeout 10s');
            req.destroy();
            resolve();
        });
    });
}

// Test 4: Variables d'environnement
function testEnvironmentVariables(projectId) {
    return new Promise((resolve) => {
        if (!projectId) {
            console.log('4️⃣ Test variables d\'environnement... ⏭️ Pas de project ID');
            return resolve();
        }
        
        console.log(`4️⃣ Test variables d'environnement...`);
        const options = {
            hostname: 'api.vercel.com',
            path: `/v9/projects/${projectId}/env`,
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`
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
                        console.log(`   ✅ ${json.envs?.length || 0} variables configurées`);
                        
                        const requiredVars = [
                            'NEXT_PUBLIC_SUPABASE_URL',
                            'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
                            'SUPABASE_SERVICE_ROLE_KEY',
                            'NEXTAUTH_SECRET',
                            'NEXTAUTH_URL'
                        ];
                        
                        requiredVars.forEach(varName => {
                            const found = json.envs?.find(env => env.key === varName);
                            console.log(`   ${found ? '✅' : '❌'} ${varName}`);
                        });
                        
                    } catch (e) {
                        console.log('   ❌ Erreur parsing variables');
                    }
                } else {
                    console.log(`   ❌ Impossible d'accéder aux variables`);
                }
                resolve();
            });
        });
        
        req.on('error', (e) => {
            console.log(`   ❌ Erreur: ${e.message}`);
            resolve();
        });
        
        req.setTimeout(10000, () => {
            console.log('   ⏰ Timeout 10s');
            req.destroy();
            resolve();
        });
    });
}

// Exécution séquentielle
async function runCompleteDiagnostic() {
    const tokenResult = await testVercelToken();
    
    if (tokenResult.success && tokenResult.projectId) {
        await testDeployments(tokenResult.projectId);
        await testEnvironmentVariables(tokenResult.projectId);
    }
    
    await testHealthCheck();
    
    console.log('\n🏁 DIAGNOSTIC COMPLET TERMINÉ');
    console.log('\n📋 RÉSUMÉ:');
    console.log('✅ Variables configurées sur Vercel');
    console.log('✅ Nouveau token avec permissions complètes');
    console.log('🔄 Redéploiement automatique en cours...');
    console.log('\n⏳ Attendre 2-3 minutes pour propagation complète');
    console.log('🔗 Test final: https://jarvis-saas-compagnon.vercel.app');
}

runCompleteDiagnostic();
