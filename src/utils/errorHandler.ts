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
 * Trata erros vindos do Supabase e converte para AppError
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Verificar se é um erro do Supabase
    if ('code' in error && 'message' in error) {
      const supabaseError = error as { code: string; message: string; details?: string };
      
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
        undefined,
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
