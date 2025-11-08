/**
 * Script de test isolé pour valider la structure GA de l'API OpenAI Realtime
 * 
 * Objectif : Tester la connexion WebSocket avec la structure GA correcte
 * 
 * Usage :
 * 1. export OPENAI_API_KEY=sk-...
 * 2. npx tsx scripts/test-openai-ga.ts
 */

import WebSocket from 'ws';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-realtime';
const VOICE = 'cedar';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY manquante');
  process.exit(1);
}

interface RealtimeEvent {
  type: string;
  session?: {
    id: string;
    model: string;
    voice?: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

async function testGA() {
  console.log('\n🧪 TEST OPENAI REALTIME API GA\n');
  console.log('═══════════════════════════════════════\n');
  
  // ============================================
  // ÉTAPE 1 : Créer un ephemeral token (GA)
  // ============================================
  console.log('📡 Étape 1 : Création ephemeral token...');
  
  try {
    const tokenResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: MODEL,
          audio: {
            output: { voice: VOICE }
          }
        }
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Erreur création token:', error);
      process.exit(1);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token créé:', tokenData.value.substring(0, 20) + '...');
    console.log('⏰ Expire à:', new Date(tokenData.expires_at * 1000).toISOString());
    
    // ============================================
    // ÉTAPE 2 : Connexion WebSocket (GA)
    // ============================================
    console.log('\n📡 Étape 2 : Connexion WebSocket...');
    
    const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=${MODEL}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.value}`,
      }
    });

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      console.error('❌ Timeout - Pas de réponse après 10s');
      ws.close();
      process.exit(1);
    }, 10000);

    ws.on('open', () => {
      console.log('✅ WebSocket connecté');
    });

    ws.on('message', (data: Buffer) => {
      const event: RealtimeEvent = JSON.parse(data.toString());
      console.log(`\n📨 Événement: ${event.type}`);
      
      switch (event.type) {
        case 'session.created':
          console.log('   ✅ Session ID:', event.session?.id);
          console.log('   ✅ Model:', event.session?.model);
          console.log('   ✅ Voice:', event.session?.voice || 'non définie');
          
          // ============================================
          // ÉTAPE 3 : Envoyer session.update (GA)
          // ============================================
          console.log('\n📡 Étape 3 : Configuration session...');
          
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions: 'Tu es un assistant de test. Réponds toujours "Test réussi !"',
              output_modalities: ['audio'],
              audio: {
                input: {
                  format: {
                    type: 'audio/pcm',
                    rate: 24000
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    silence_duration_ms: 500,
                    prefix_padding_ms: 300,
                    create_response: true
                  }
                },
                output: {
                  voice: VOICE,
                  format: {
                    type: 'audio/pcm',
                    rate: 24000
                  }
                }
              }
            }
          }));
          break;
        
        case 'session.updated':
          console.log('   ✅ Session configurée avec succès !');
          console.log('\n═══════════════════════════════════════');
          console.log('✅ TEST GA RÉUSSI !\n');
          console.log('Structure validée :');
          console.log('  • Endpoint: /v1/realtime/client_secrets ✓');
          console.log('  • WebSocket: /v1/realtime?model=... ✓');
          console.log('  • Structure: { session: { type: "realtime", ... } } ✓');
          console.log('  • Format audio: audio/pcm @ 24000Hz ✓');
          console.log('  • Événements: session.created → session.updated ✓');
          console.log('═══════════════════════════════════════\n');
          
          clearTimeout(timeout);
          ws.close();
          process.exit(0);
          break;
        
        case 'error':
          console.error('   ❌ Erreur API:', event.error?.message);
          console.error('   Code:', event.error?.code);
          clearTimeout(timeout);
          ws.close();
          process.exit(1);
          break;
        
        default:
          console.log('   ℹ️  Événement non géré (normal)');
      }
    });

    ws.on('error', (error) => {
      console.error('\n❌ Erreur WebSocket:', error.message);
      clearTimeout(timeout);
      process.exit(1);
    });

    ws.on('close', () => {
      console.log('\n🔌 WebSocket fermé');
    });

  } catch (error) {
    console.error('\n❌ Erreur globale:', error);
    process.exit(1);
  }
}

// Lancer le test
testGA();

