import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../utils/errorHandler';
import { validateBeforeSend } from '../utils/validation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão ativa
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Se houver erro ao obter a sessão, limpar tokens inválidos
        supabase.auth.signOut();
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      // Só considerar loading completo se não for uma página de convite
      const isInvitePage = window.location.hash.includes('type=invite') || 
                          window.location.pathname.includes('/accept-invite');
      
      if (!isInvitePage) {
        setLoading(false);
      } else {
        // Para páginas de convite, liberar imediatamente
        setLoading(false);
      }
    }).catch(() => {
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Se o evento for TOKEN_REFRESHED com falha, fazer logout
      if (_event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed, logout handled by state change
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sistema de detecção de inatividade (5 minutos)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutos em milissegundos
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Fazer logout após 5 minutos de inatividade
        signOut();
      }, INACTIVITY_TIME);
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adicionar listeners para todos os eventos
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Iniciar o timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    // Validar dados antes de enviar (validação adicional de segurança)
    const validation = validateBeforeSend(email, password);
    
    if (!validation.isValid) {
      const validationError = new Error(validation.errors.join(' '));
      (validationError as any).status = 400;
      throw validationError;
    }
    
    // Preparar payload no formato esperado pelo Supabase
    const payload = {
      email: validation.data!.email,
      password: validation.data!.password,
    };
    
    // Log do payload (sem senha completa) em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('📤 Enviando dados de autenticação:', {
        email: payload.email,
        passwordLength: payload.password.length,
        payloadFormat: 'signInWithPassword',
      });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    
    if (error) {
      // Traduzir mensagem de erro usando a função utilitária
      const errorMessage = translateAuthError(error);
      
      // Criar um novo erro com a mensagem traduzida
      const translatedError = new Error(errorMessage);
      (translatedError as any).status = error.status;
      (translatedError as any).originalError = error;
      
      // Log do erro em desenvolvimento para debug
      if (import.meta.env.DEV) {
        console.error('❌ Erro de autenticação:', {
          status: error.status,
          message: error.message,
          translatedMessage: errorMessage,
          email: payload.email,
        });
      }
      
      throw translatedError;
    }
    
    // Log de sucesso em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('✅ Autenticação bem-sucedida:', {
        userId: data.user?.id,
        email: data.user?.email,
      });
    }
    
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
