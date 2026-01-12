/**
 * Sistema centralizado de tratamento de erros
 * Padroniza erros vindos do Supabase e outras fontes
 */

/**
 * Classe customizada para erros da aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Traduz erros de autenticação do Supabase para português
 */
export function translateAuthError(error: any): string {
  if (!error) return 'Erro desconhecido ao fazer login.';
  
  const status = error.status || error.statusCode;
  const message = error.message || '';
  
  // Erros 401 - Não autorizado
  if (status === 401) {
    if (message.includes('Invalid login credentials') || 
        message.includes('Invalid credentials') ||
        message.includes('invalid_grant')) {
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
    }
    if (message.includes('User not found')) {
      return 'Usuário não encontrado. Verifique se o email está correto.';
    }
    return 'Não foi possível fazer login. Verifique suas credenciais.';
  }
  
  // Erros 400 - Requisição inválida
  if (status === 400) {
    if (message.includes('email')) {
      return 'Formato de email inválido. Verifique e tente novamente.';
    }
    if (message.includes('password')) {
      return 'A senha não pode estar vazia.';
    }
    return 'Dados inválidos. Verifique os campos e tente novamente.';
  }
  
  // Erros 429 - Muitas requisições
  if (status === 429) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
  }
  
  // Erros 500 - Erro do servidor
  if (status === 500 || status >= 500) {
    return 'Erro no servidor. Tente novamente em alguns instantes.';
  }
  
  // Erro de rede
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  // Mensagem padrão
  return message || 'Erro ao fazer login. Tente novamente.';
}

/**
 * Trata erros vindos do Supabase e converte para AppError
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Verificar se é um erro do Supabase
    if ('code' in error && 'message' in error) {
      const supabaseError = error as { code: string; message: string; details?: string; status?: number };
      
      // Mapear códigos comuns do Supabase para mensagens amigáveis
      const errorMessages: Record<string, string> = {
        'PGRST116': 'Registro não encontrado',
        '23505': 'Já existe um registro com esses dados',
        '23503': 'Não é possível executar esta operação. Dados relacionados existem.',
        '42501': 'Você não tem permissão para executar esta operação',
      };

      const friendlyMessage = errorMessages[supabaseError.code] || supabaseError.message;

      return new AppError(
        friendlyMessage,
        supabaseError.code,
        supabaseError.status,
        error
      );
    }

    // Erro genérico
    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, error);
  }

  // Erro desconhecido
  return new AppError('Erro desconhecido', 'UNKNOWN_ERROR');
}

/**
 * Loga erro para serviços de monitoramento (ex: Sentry)
 * Preparado para produção
 */
export function logError(error: AppError, context?: Record<string, unknown>): void {
  if (import.meta.env.PROD) {
    // TODO: Integrar com serviço de monitoramento
    // Exemplo: Sentry.captureException(error, { extra: context });
    console.error('Error logged:', error, context);
  } else {
    // Em desenvolvimento, sempre loga
    console.error('Error:', error, context);
  }
}
