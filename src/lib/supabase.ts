import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env\n' +
    'Veja o arquivo .env.example para referência.';
  
  console.error('⚠️', errorMsg);
  console.error('⚠️ Supabase URL:', supabaseUrl || 'NÃO CONFIGURADA');
  console.error('⚠️ Supabase Key:', supabaseAnonKey ? 'CONFIGURADA (oculta)' : 'NÃO CONFIGURADA');
  
  // Em desenvolvimento, apenas avisar, mas não quebrar a aplicação
  // Em produção, lançar erro
  if (!import.meta.env.DEV) {
    throw new Error(errorMsg);
  }
} else {
  // Log de confirmação
  if (import.meta.env.DEV) {
    console.log('✅ Supabase configurado:', {
      url: supabaseUrl,
      keyConfigured: !!supabaseAnonKey,
    });
  } else {
    // Em produção, log mínimo mas útil para debug
    console.log('✅ Supabase configurado para produção');
    
    // Verificar se as variáveis parecem corretas
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      console.log('   URL:', supabaseUrl);
    } else {
      console.error('   ⚠️ URL pode estar incorreta');
    }
    
    if (supabaseAnonKey && supabaseAnonKey.length > 100) {
      console.log('   Chave API: Configurada');
    } else {
      console.error('   ⚠️ Chave API pode estar incorreta');
    }
  }
}

// Criar cliente Supabase (usando valores padrão em dev se não configurado)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
});

// Adicionar listener global para erros de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  // Auth state changes are handled by AuthContext
});

// Carregar utilitários de diagnóstico e validação
// Em produção, carregar apenas diagnóstico de produção
if (import.meta.env.DEV) {
  import('../utils/supabaseDiagnostics').catch(() => {
    // Ignorar erro se o arquivo não existir
  });
  import('../utils/validateConnectionData').catch(() => {
    // Ignorar erro se o arquivo não existir
  });
  import('../utils/testConnectionData').catch(() => {
    // Ignorar erro se o arquivo não existir
  });
} else {
  // Em produção, carregar diagnóstico de produção
  import('../utils/productionDiagnostics').catch(() => {
    // Ignorar erro se o arquivo não existir
  });
}
