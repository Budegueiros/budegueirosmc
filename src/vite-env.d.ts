/// <reference types="vite/client" />

/**
 * Definições de tipos para variáveis de ambiente
 * Garante type safety ao usar import.meta.env
 */
interface ImportMetaEnv {
  /**
   * URL do projeto Supabase
   * Exemplo: https://your-project.supabase.co
   */
  readonly VITE_SUPABASE_URL: string;

  /**
   * Chave pública (anon key) do Supabase
   * Esta chave é segura para uso no cliente
   */
  readonly VITE_SUPABASE_ANON_KEY: string;

  /**
   * Ambiente da aplicação
   * Valores possíveis: 'development' | 'staging' | 'production'
   */
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';

  /**
   * Versão da aplicação (opcional)
   */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
