// Script de diagnostic Vercel API
// Pour diagnostiquer l'erreur 404 DEPLOYMENT_NOT_FOUND

const https = require('https');

// Configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.argv[2];
const PROJECT_NAME = 'jarvis-saas-compagnon'; // Nom du projet

if (!VERCEL_TOKEN) {
  console.error('❌ Token Vercel requis !');
  console.log('Usage: node vercel-diagnostic.js YOUR_VERCEL_TOKEN');
  console.log('Ou: VERCEL_TOKEN=your_token node vercel-diagnostic.js');
  process.exit(1);
}

console.log('🔍 Diagnostic Vercel API - Projet:', PROJECT_NAME);
console.log('⏰ Date:', new Date().toISOString());
console.log('');

// Fonction pour faire des appels API
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
    req.end();
  });
}

async function diagnostic() {
  try {
    console.log('📊 1. Vérification du compte...');
    const user = await apiCall('/v2/user');
    if (user.status === 200) {
      console.log(`✅ Connecté en tant que: ${user.data.username || user.data.email}`);
      console.log(`📧 Email: ${user.data.email}`);
    } else {
      console.log('❌ Erreur d\'authentification:', user.status, user.data);
      return;
    }

    console.log('');
    console.log('📊 2. Liste des projets...');
    const projects = await apiCall('/v9/projects');
    if (projects.status === 200) {
      console.log(`✅ Nombre de projets: ${projects.data.projects.length}`);
      
      const targetProject = projects.data.projects.find(p => 
        p.name === PROJECT_NAME || 
        p.name.includes('jarvis') || 
        p.name.includes('saas')
      );

      if (targetProject) {
        console.log(`🎯 Projet trouvé: ${targetProject.name}`);
        console.log(`📍 ID: ${targetProject.id}`);
        console.log(`🌐 Framework: ${targetProject.framework}`);
        console.log(`🏠 Repo: ${targetProject.link?.type} - ${targetProject.link?.repo}`);
        
        console.log('');
        console.log('📊 3. Déploiements récents...');
        const deployments = await apiCall(`/v6/deployments?projectId=${targetProject.id}&limit=10`);
        
        if (deployments.status === 200) {
          console.log(`✅ Nombre de déploiements: ${deployments.data.deployments.length}`);
          
          deployments.data.deployments.forEach((deploy, index) => {
            const date = new Date(deploy.created).toLocaleString();
            console.log(`${index + 1}. ${deploy.uid}`);
            console.log(`   📅 Date: ${date}`);
            console.log(`   🔧 État: ${deploy.state}`);
            console.log(`   🌐 URL: ${deploy.url}`);
            console.log(`   🎯 Branche: ${deploy.meta?.githubCommitRef || 'N/A'}`);
            console.log(`   💬 Commit: ${deploy.meta?.githubCommitMessage?.substring(0, 50) || 'N/A'}...`);
            
            if (deploy.state === 'ERROR') {
              console.log(`   ❌ ERREUR DÉTECTÉE !`);
            }
            console.log('');
          });

          // Détails du dernier déploiement
          const lastDeploy = deployments.data.deployments[0];
          if (lastDeploy) {
            console.log('📊 4. Détails du dernier déploiement...');
            const deployDetails = await apiCall(`/v13/deployments/${lastDeploy.uid}`);
            
            if (deployDetails.status === 200) {
              const deploy = deployDetails.data;
              console.log(`✅ ID: ${deploy.uid}`);
              console.log(`🔧 État: ${deploy.state}`);
              console.log(`⏰ Créé: ${new Date(deploy.created).toLocaleString()}`);
              console.log(`🚀 Déployé: ${deploy.ready ? new Date(deploy.ready).toLocaleString() : 'En cours'}`);
              console.log(`🌐 URL: https://${deploy.url}`);
              
              if (deploy.aliasError) {
                console.log(`❌ Erreur d'alias: ${deploy.aliasError.message}`);
              }
              
              if (deploy.state === 'ERROR') {
                console.log('❌ DÉPLOIEMENT EN ERREUR !');
                
                // Obtenir les logs de build
                console.log('');
                console.log('📊 5. Logs de build...');
                const buildLogs = await apiCall(`/v2/deployments/${lastDeploy.uid}/events`);
                
                if (buildLogs.status === 200) {
                  const errors = buildLogs.data.filter(log => 
                    log.type === 'stderr' || 
                    log.payload?.text?.includes('error') ||
                    log.payload?.text?.includes('ERROR')
                  );
                  
                  if (errors.length > 0) {
                    console.log(`❌ ${errors.length} erreurs trouvées:`);
                    errors.slice(0, 5).forEach((error, i) => {
                      console.log(`${i + 1}. ${error.payload?.text || error.text}`);
                    });
                  }
                }
              }
            }
          }
        }
        
        // Vérifier les domaines
        console.log('');
        console.log('📊 6. Configuration des domaines...');
        const domains = await apiCall(`/v5/projects/${targetProject.id}/domains`);
        if (domains.status === 200) {
          console.log(`✅ Nombre de domaines: ${domains.data.domains.length}`);
          domains.data.domains.forEach(domain => {
            console.log(`🌐 ${domain.name} - Vérifié: ${domain.verified}`);
          });
        }
        
      } else {
        console.log('❌ Projet non trouvé !');
        console.log('📋 Projets disponibles:');
        projects.data.projects.slice(0, 10).forEach(p => {
          console.log(`   - ${p.name} (${p.id})`);
        });
      }
    } else {
      console.log('❌ Erreur lors de la récupération des projets:', projects.status, projects.data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

diagnostic();
