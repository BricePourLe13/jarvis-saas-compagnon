// Diagnostic Vercel avec API - Version simple
const https = require('https');

async function checkVercelStatus() {
  console.log('🔍 Diagnostic Vercel API');
  console.log('⏰ Date:', new Date().toISOString());
  
  // Test de connectivité de base avec l'API publique
  try {
    console.log('\n📊 1. Test de l\'API publique Vercel...');
    
    // Vérifier l'état général de Vercel
    const statusCheck = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.vercel.com',
        path: '/v1/status',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({ status: 'ERROR', error: error.message });
      });
      
      req.end();
    });
    
    if (statusCheck.status === 200) {
      console.log('✅ API Vercel accessible');
    } else {
      console.log('❌ Problème API Vercel:', statusCheck.status);
    }
    
    console.log('\n📊 2. Test de l\'application déployée...');
    
    // Tester les différentes URLs possibles
    const urls = [
      'jarvis-saas-compagnon.vercel.app',
      'jarvis-saas-compagnon-git-main-bricepourle13.vercel.app',
      'jarvis-saas-compagnon-bricepourle13.vercel.app'
    ];
    
    for (const url of urls) {
      const result = await new Promise((resolve) => {
        const req = https.request({
          hostname: url,
          path: '/',
          method: 'GET',
          headers: {
            'User-Agent': 'Vercel-Diagnostic/1.0'
          }
        }, (res) => {
          resolve({
            url: url,
            status: res.statusCode,
            headers: res.headers
          });
        });
        
        req.on('error', (error) => {
          resolve({
            url: url,
            status: 'ERROR',
            error: error.message
          });
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          resolve({
            url: url,
            status: 'TIMEOUT'
          });
        });
        
        req.end();
      });
      
      console.log(`🌐 ${result.url}: ${result.status}`);
      if (result.headers && result.headers['x-vercel-id']) {
        console.log(`   📍 Vercel ID: ${result.headers['x-vercel-id']}`);
      }
      if (result.headers && result.headers.server) {
        console.log(`   🖥️  Serveur: ${result.headers.server}`);
      }
    }
    
    console.log('\n📊 3. Recommandations...');
    
    console.log('💡 Pour un diagnostic complet avec token:');
    console.log('   node jarvis-saas-compagnon/vercel-diagnostic.js YOUR_TOKEN');
    
    console.log('\n💡 Solutions possibles:');
    console.log('   1. ✅ Configurer Vercel Project Settings');
    console.log('   2. ✅ Vérifier Root Directory dans Vercel Dashboard');
    console.log('   3. ✅ Redéployer manuellement depuis Vercel');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkVercelStatus();
