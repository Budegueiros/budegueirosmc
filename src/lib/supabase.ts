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
  // Log de confirmação (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.log('✅ Supabase configurado:', {
      url: supabaseUrl,
      keyConfigured: !!supabaseAnonKey,
    });
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

// Carregar utilitário de diagnóstico (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  import('../utils/supabaseDiagnostics').catch(() => {
    // Ignorar erro se o arquivo não existir
  });
}
