// Script pour assigner le déploiement au domaine principal
const https = require('https');

const VERCEL_TOKEN = 'yCDCylU9sywZSr4Qu75xfdh1';
const PROJECT_ID = 'prj_YkjMHX8V7OmoMGdFZ97BK7B29M4b';
const DEPLOYMENT_ID = 'dpl_4qncMYQ7My2MDc7Fiko6Fiokre2V';
const DOMAIN = 'jarvis-saas-compagnon.vercel.app';

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

async function assignDeploymentToDomain() {
  console.log('🔧 Assignation du déploiement au domaine principal...');
  console.log(`📍 Déploiement: ${DEPLOYMENT_ID}`);
  console.log(`🌐 Domaine: ${DOMAIN}`);
  console.log('');

  try {
    // 1. Vérifier le statut actuel du domaine
    console.log('📊 1. Vérification du domaine actuel...');
    const domainInfo = await apiCall(`/v9/projects/${PROJECT_ID}/domains/${DOMAIN}`);
    
    if (domainInfo.status === 200) {
      console.log(`✅ Domaine trouvé: ${domainInfo.data.name}`);
      console.log(`🎯 Déploiement actuel: ${domainInfo.data.gitBranch || 'N/A'}`);
    }

    // 2. Créer un alias pour assigner le déploiement au domaine
    console.log('');
    console.log('📊 2. Assignation du déploiement...');
    
    const aliasResult = await apiCall(`/v2/deployments/${DEPLOYMENT_ID}/aliases`, {
      method: 'POST',
      body: {
        alias: DOMAIN
      }
    });

    if (aliasResult.status === 200 || aliasResult.status === 201) {
      console.log(`✅ Déploiement assigné avec succès !`);
      console.log(`🌐 URL: https://${DOMAIN}`);
      console.log(`🎯 Alias ID: ${aliasResult.data.uid || 'N/A'}`);
    } else if (aliasResult.status === 409) {
      console.log(`⚠️ Le domaine est déjà assigné à ce déploiement`);
    } else {
      console.log(`❌ Erreur lors de l'assignation:`, aliasResult.status);
      console.log(`📋 Détails:`, aliasResult.data);
    }

    // 3. Vérification finale
    console.log('');
    console.log('📊 3. Vérification finale...');
    
    // Attendre un peu pour la propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalCheck = await apiCall(`/v9/projects/${PROJECT_ID}/domains/${DOMAIN}`);
    if (finalCheck.status === 200) {
      console.log(`✅ Statut final du domaine:`);
      console.log(`   🌐 Nom: ${finalCheck.data.name}`);
      console.log(`   ✅ Vérifié: ${finalCheck.data.verified}`);
      console.log(`   🔧 Configuration: ${finalCheck.data.configuredBy || 'N/A'}`);
    }

    console.log('');
    console.log('🎉 Processus terminé ! Testez maintenant:');
    console.log(`   🌐 https://${DOMAIN}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

assignDeploymentToDomain();
