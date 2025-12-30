import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrksozrkfldqqiibyhsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFya3NvenJrZmxkcXFpaWJ5aHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTY1MDAsImV4cCI6MjA4MjQ5MjUwMH0.Q1ffBoKmnEKJA_XGU_0dddZ0MafnGzhJVG6S7f2dKow';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token atualizado com sucesso');
  } else if (event === 'SIGNED_OUT') {
    console.log('Usuário deslogado');
  } else if (event === 'USER_UPDATED') {
    console.log('Usuário atualizado');
  }
});
