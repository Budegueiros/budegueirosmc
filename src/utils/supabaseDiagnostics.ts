/**
 * Utilitário para diagnosticar problemas de configuração do Supabase
 * Use no console do navegador: window.diagnoseSupabase()
 */

import { supabase } from '../lib/supabase';

export async function diagnoseSupabase() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    issues: [] as string[],
    config: {} as Record<string, any>,
    tests: {} as Record<string, any>,
  };

  // Verificar variáveis de ambiente
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  diagnostics.config = {
    url: supabaseUrl || 'NÃO CONFIGURADA',
    urlValid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
    keyConfigured: !!supabaseAnonKey,
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  };

  if (!supabaseUrl) {
    diagnostics.issues.push('VITE_SUPABASE_URL não está configurada');
  } else if (!supabaseUrl.startsWith('https://')) {
    diagnostics.issues.push('VITE_SUPABASE_URL não é uma URL válida (deve começar com https://)');
  }

  if (!supabaseAnonKey) {
    diagnostics.issues.push('VITE_SUPABASE_ANON_KEY não está configurada');
  } else if (supabaseAnonKey.length < 100) {
    diagnostics.issues.push('VITE_SUPABASE_ANON_KEY parece estar incorreta (muito curta)');
  }

  // Teste 1: Verificar se o cliente Supabase foi criado
  try {
    diagnostics.tests.clientCreated = !!supabase;
    diagnostics.tests.clientUrl = supabaseUrl || 'N/A';
  } catch (error) {
    diagnostics.issues.push('Erro ao criar cliente Supabase');
    diagnostics.tests.clientError = String(error);
  }

  // Teste 2: Tentar fazer uma requisição simples (sem autenticação)
  try {
    const { data, error } = await supabase.from('_test_connection').select('*').limit(0);
    // Esperamos um erro 404 ou similar, mas não um erro de conexão
    if (error && error.code === 'PGRST116') {
      diagnostics.tests.connectionTest = 'OK - Conectado ao Supabase (erro esperado para tabela inexistente)';
    } else if (error && error.message.includes('JWT')) {
      diagnostics.tests.connectionTest = 'OK - Conectado ao Supabase (erro de autenticação esperado)';
    } else if (error) {
      diagnostics.tests.connectionTest = `Possível problema: ${error.message}`;
      diagnostics.issues.push(`Erro na conexão: ${error.message}`);
    } else {
      diagnostics.tests.connectionTest = 'OK - Conectado ao Supabase';
    }
  } catch (error: any) {
    diagnostics.tests.connectionTest = `ERRO: ${error.message}`;
    diagnostics.issues.push(`Erro de conexão: ${error.message}`);
  }

  // Teste 3: Verificar se há sessão ativa
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    diagnostics.tests.sessionCheck = {
      hasSession: !!session,
      hasError: !!error,
      errorMessage: error?.message,
    };
  } catch (error: any) {
    diagnostics.tests.sessionCheck = {
      error: error.message,
    };
    diagnostics.issues.push(`Erro ao verificar sessão: ${error.message}`);
  }

  // Resumo
  diagnostics.summary = {
    totalIssues: diagnostics.issues.length,
    status: diagnostics.issues.length === 0 ? 'OK' : 'PROBLEMAS ENCONTRADOS',
  };

  console.group('🔍 Diagnóstico do Supabase');
  console.log('Configuração:', diagnostics.config);
  console.log('Testes:', diagnostics.tests);
  if (diagnostics.issues.length > 0) {
    console.warn('⚠️ Problemas encontrados:', diagnostics.issues);
  } else {
    console.log('✅ Nenhum problema encontrado');
  }
  console.log('Resumo:', diagnostics.summary);
  console.groupEnd();

  return diagnostics;
}

// Expor globalmente para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).diagnoseSupabase = diagnoseSupabase;
}
