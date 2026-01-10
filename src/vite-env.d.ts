/// <reference types="vite/client" />

// Declarações de módulos CSS do Swiper
declare module 'swiper/css';
declare module 'swiper/css/pagination';
declare module 'swiper/css/navigation';

// Tipos para variáveis de ambiente
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
