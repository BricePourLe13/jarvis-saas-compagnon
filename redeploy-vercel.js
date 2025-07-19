// Script pour redéployer et forcer l'assignation du domaine
const https = require('https');

const VERCEL_TOKEN = 'yCDCylU9sywZSr4Qu75xfdh1';
const PROJECT_ID = 'prj_YkjMHX8V7OmoMGdFZ97BK7B29M4b';

function apiCall(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.vercel.com',
      path: endpoint,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function triggerRedeploy() {
  console.log('🚀 Déclenchement d\'un nouveau déploiement...');
  console.log(`📍 Projet: ${PROJECT_ID}`);
  console.log('');

  try {
    // 1. Déclencher un redéploiement du dernier commit
    console.log('📊 1. Déclenchement du redéploiement...');
    
    const deployResult = await apiCall(`/v13/deployments`, {
      method: 'POST',
      body: {
        name: 'jarvis-saas-compagnon',
        project: PROJECT_ID,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: 'BricePourLe13/jarvis-saas-compagnon',
          ref: 'main'
        }
      }
    });

    if (deployResult.status === 200 || deployResult.status === 201) {
      console.log(`✅ Déploiement déclenché !`);
      console.log(`🆔 ID: ${deployResult.data.id || deployResult.data.uid}`);
      console.log(`🌐 URL: ${deployResult.data.url}`);
      console.log(`🔧 État: ${deployResult.data.state || 'QUEUED'}`);
      
      console.log('');
      console.log('⏰ Le déploiement peut prendre 1-2 minutes...');
      console.log('🌐 Surveillez https://jarvis-saas-compagnon.vercel.app');
      
    } else {
      console.log(`❌ Erreur lors du déploiement:`, deployResult.status);
      console.log(`📋 Détails:`, deployResult.data);
      
      // Alternative: Essayer de redéployer un déploiement existant
      console.log('');
      console.log('📊 Alternative: Redéploiement d\'un déploiement existant...');
      
      const redeployResult = await apiCall(`/v13/deployments/dpl_4qncMYQ7My2MDc7Fiko6Fiokre2V/redeploy`, {
        method: 'POST',
        body: {
          name: 'jarvis-saas-compagnon',
          target: 'production'
        }
      });
      
      if (redeployResult.status === 200 || redeployResult.status === 201) {
        console.log(`✅ Redéploiement déclenché !`);
        console.log(`🆔 ID: ${redeployResult.data.id || redeployResult.data.uid}`);
      } else {
        console.log(`❌ Erreur redéploiement:`, redeployResult.status, redeployResult.data);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

triggerRedeploy();
