import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
      
      setLoading(false);
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
      // TOKEN_REFRESHED sem sessão é tratado pela mudança de estado acima
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  // Sistema de detecção de inatividade (5 minutos)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIME = 5 * 60 * 1000;
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(signOut, INACTIVITY_TIME);
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adicionar listeners para todos os eventos
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Iniciar o timer
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user, signOut]);

  const signIn = async (email: string, password: string) => {
    // Validar dados antes de enviar (validação adicional de segurança)
    const validation = validateBeforeSend(email, password);
    
    if (!validation.isValid) {
      const validationError = new Error(validation.errors.join(' '));
      (validationError as any).status = 400;
      throw validationError;
    }
    
    const payload = {
      email: validation.data!.email,
      password: validation.data!.password,
    };
    
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    
    if (error) {
      // Traduzir mensagem de erro usando a função utilitária
      const errorMessage = translateAuthError(error);
      
      // Criar um novo erro com a mensagem traduzida
      const translatedError = new Error(errorMessage);
      (translatedError as any).status = error.status;
      (translatedError as any).originalError = error;
      
      throw translatedError;
    }
    
    return data;
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
