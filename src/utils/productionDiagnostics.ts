/**
 * Diagnóstico específico para problemas de produção
 * Compara configuração entre localhost e produção
 */

import { supabase } from '../lib/supabase';

/**
 * Diagnostica problemas específicos de produção
 */
export async function diagnoseProduction() {
  console.group('🔍 DIAGNÓSTICO DE PRODUÇÃO');
  
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    isProduction: !import.meta.env.DEV,
    currentUrl: window.location.href,
    issues: [] as string[],
    config: {} as Record<string, any>,
    tests: {} as Record<string, any>,
  };
  
  // 1. Verificar variáveis de ambiente
  console.log('\n1️⃣ VARIÁVEIS DE AMBIENTE');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  diagnostics.config = {
    url: supabaseUrl || 'NÃO CONFIGURADA',
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseAnonKey,
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  };
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL não configurada');
    diagnostics.issues.push('VITE_SUPABASE_URL não configurada');
  } else {
    console.log('✅ VITE_SUPABASE_URL:', supabaseUrl);
    
    // Verificar se a URL está correta
    if (!supabaseUrl.startsWith('https://')) {
      console.error('❌ URL não começa com https://');
      diagnostics.issues.push('URL do Supabase inválida');
    }
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY não configurada');
    diagnostics.issues.push('VITE_SUPABASE_ANON_KEY não configurada');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY: Configurada');
    
    // Verificar comprimento da chave (chaves do Supabase são longas)
    if (supabaseAnonKey.length < 100) {
      console.warn('⚠️ Chave API parece muito curta (pode estar incorreta)');
      diagnostics.issues.push('Chave API pode estar incorreta');
    }
  }
  
  // 2. Verificar ambiente atual
  console.log('\n2️⃣ AMBIENTE ATUAL');
  console.log('URL atual:', window.location.href);
  console.log('Host:', window.location.host);
  console.log('Protocolo:', window.location.protocol);
  console.log('Modo:', import.meta.env.MODE);
  console.log('É produção:', !import.meta.env.DEV ? '✅ SIM' : '❌ NÃO');
  
  // 3. Verificar configuração do Supabase Auth
  console.log('\n3️⃣ CONFIGURAÇÃO DO SUPABASE AUTH');
  const authConfig = supabase.auth;
  console.log('Cliente Supabase criado:', !!authConfig ? '✅ SIM' : '❌ NÃO');
  
  // 4. Teste de conexão
  console.log('\n4️⃣ TESTE DE CONEXÃO');
  try {
    const { error: connectionError } = await supabase.from('_test_connection').select('*').limit(0);
    
    if (connectionError) {
      if (connectionError.code === 'PGRST116' || connectionError.message.includes('JWT')) {
        console.log('✅ Conexão com Supabase: OK');
        diagnostics.tests.connection = 'OK';
      } else {
        console.error('❌ Erro de conexão:', connectionError.message);
        diagnostics.issues.push(`Erro de conexão: ${connectionError.message}`);
        diagnostics.tests.connection = 'ERROR';
      }
    } else {
      console.log('✅ Conexão com Supabase: OK');
      diagnostics.tests.connection = 'OK';
    }
  } catch (error: any) {
    console.error('❌ Erro ao testar conexão:', error.message);
    diagnostics.issues.push(`Erro ao testar conexão: ${error.message}`);
    diagnostics.tests.connection = 'ERROR';
  }
  
  // 5. Verificar localStorage
  console.log('\n5️⃣ VERIFICAÇÃO DE STORAGE');
  try {
    const storageKey = 'supabase.auth.token';
    const stored = localStorage.getItem(storageKey);
    console.log('Token armazenado:', stored ? '✅ SIM' : '❌ NÃO');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Token válido:', parsed ? '✅ SIM' : '❌ NÃO');
      } catch (e) {
        console.warn('⚠️ Token armazenado em formato inválido');
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao verificar localStorage:', error.message);
    diagnostics.issues.push('Problema com localStorage');
  }
  
  // 6. Verificar URLs de redirecionamento
  console.log('\n6️⃣ URLS DE REDIRECIONAMENTO');
  const currentOrigin = window.location.origin;
  console.log('Origin atual:', currentOrigin);
  console.log('URLs que devem estar configuradas no Supabase:');
  console.log('  -', currentOrigin);
  console.log('  -', currentOrigin + '/');
  console.log('  -', currentOrigin + '/*');
  console.log('\n⚠️ IMPORTANTE: Verifique no Supabase Dashboard:');
  console.log('   Settings → Authentication → URL Configuration');
  console.log('   Adicione:', currentOrigin);
  
  // 7. Verificar CORS
  console.log('\n7️⃣ VERIFICAÇÃO DE CORS');
  console.log('Origin:', window.location.origin);
  console.log('Supabase URL:', supabaseUrl);
  
  if (supabaseUrl) {
    const supabaseOrigin = new URL(supabaseUrl).origin;
    console.log('Supabase Origin:', supabaseOrigin);
    
    if (window.location.origin !== supabaseOrigin) {
      console.log('✅ Origins diferentes (esperado para CORS)');
    }
  }
  
  // 8. Resumo
  console.log('\n8️⃣ RESUMO');
  console.log('Total de problemas encontrados:', diagnostics.issues.length);
  
  if (diagnostics.issues.length === 0) {
    console.log('✅ Nenhum problema encontrado na configuração');
    console.log('\n💡 Se o login ainda não funciona, verifique:');
    console.log('   1. URLs de redirecionamento no Supabase Dashboard');
    console.log('   2. Se o usuário existe no banco de dados');
    console.log('   3. Se a conta está ativa');
    console.log('   4. Logs do Supabase para erros específicos');
  } else {
    console.error('❌ Problemas encontrados:');
    diagnostics.issues.forEach((issue, index) => {
      console.error(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.groupEnd();
  
  return diagnostics;
}

// Expor globalmente
if (typeof window !== 'undefined') {
  (window as any).diagnoseProduction = diagnoseProduction;
}
