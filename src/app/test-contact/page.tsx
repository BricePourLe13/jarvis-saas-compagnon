'use client';

import { useState } from 'react';
import { getSupabaseSingleton } from '@/lib/supabase-singleton';

export default function TestContactPage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testSupabaseConfig = () => {
    setStatus('testing');
    setError('');
    
    try {
      // Test 1: Variables d'environnement
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('🔍 Test Variables d\'environnement:');
      console.log('  URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
      console.log('  Anon Key:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
      
      // Test 2: Instance Supabase
      const supabase = getSupabaseSingleton();
      console.log('✅ Instance Supabase créée');
      
      setResult({
        env: {
          url: supabaseUrl ? '✅ OK' : '❌ MANQUANTE',
          anonKey: supabaseAnonKey ? '✅ OK' : '❌ MANQUANTE'
        },
        supabase: supabase ? '✅ Créée' : '❌ Erreur'
      });
      
      setStatus('success');
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const testInsert = async () => {
    setStatus('testing');
    setError('');
    
    try {
      const supabase = getSupabaseSingleton();
      
      const testData = {
        email: `test-${Date.now()}@example.com`,
        full_name: 'Test User ' + new Date().toLocaleTimeString(),
        company_name: 'Test Company',
        phone: '+33612345678',
        message: 'Message de test automatique',
        lead_type: 'contact',
        user_agent: navigator.userAgent
      };
      
      console.log('📤 Envoi des données:', testData);
      
      const { data, error } = await supabase
        .from('contact_leads')
        .insert([testData])
        .select();
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      console.log('✅ Données insérées:', data);
      setResult({ success: true, data });
      setStatus('success');
    } catch (err: any) {
      console.error('❌ Erreur insertion:', err);
      setError(err.message || JSON.stringify(err));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test Formulaire de Contact</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testSupabaseConfig}
            disabled={status === 'testing'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
          >
            {status === 'testing' ? '⏳ Test en cours...' : '🔍 Tester Configuration Supabase'}
          </button>
          
          <button
            onClick={testInsert}
            disabled={status === 'testing'}
            className="ml-4 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
          >
            {status === 'testing' ? '⏳ Test en cours...' : '📤 Tester Insertion'}
          </button>
        </div>
        
        {status === 'success' && result && (
          <div className="p-6 bg-green-900/30 border border-green-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-green-400 mb-4">✅ Test Réussi</h2>
            <pre className="text-sm text-green-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        {status === 'error' && error && (
          <div className="p-6 bg-red-900/30 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-4">❌ Erreur</h2>
            <pre className="text-sm text-red-300 overflow-auto whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}
        
        <div className="mt-8 p-6 bg-neutral-900/50 border border-white/10 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📝 Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-neutral-300">
            <li>Cliquez sur "Tester Configuration Supabase" pour vérifier les variables d'environnement</li>
            <li>Ouvrez la console du navigateur (F12) pour voir les logs détaillés</li>
            <li>Cliquez sur "Tester Insertion" pour tester l'insertion réelle dans la base</li>
            <li>Si une erreur apparaît, lisez le message complet ci-dessus</li>
          </ol>
        </div>
        
        <div className="mt-6">
          <a 
            href="/landing-client" 
            className="inline-block px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
          >
            ← Retour à la Landing Page
          </a>
        </div>
      </div>
    </div>
  );
}

