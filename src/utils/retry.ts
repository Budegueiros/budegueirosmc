/**
 * Utilitário para retry logic em requisições
 * Implementa retry exponencial backoff para operações que podem falhar
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'network', 'timeout'],
};

/**
 * Verifica se um erro é retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorCode = (error as { code?: string })?.code?.toUpperCase() || '';

  return retryableErrors.some(
    (retryable) =>
      errorMessage.includes(retryable.toLowerCase()) || errorCode.includes(retryable.toUpperCase())
  );
}

/**
 * Calcula o delay para o próximo retry usando exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Aguarda um período de tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executa uma função com retry logic
 * 
 * @param fn - Função assíncrona a ser executada
 * @param options - Opções de retry
 * @returns Resultado da função ou lança o último erro
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Se não for o último attempt e o erro for retryable, tentar novamente
      if (attempt < opts.maxRetries && isRetryableError(error, opts.retryableErrors)) {
        const delay = calculateDelay(attempt, opts);
        console.warn(
          `Tentativa ${attempt + 1}/${opts.maxRetries + 1} falhou. Tentando novamente em ${delay}ms...`,
          error
        );
        await sleep(delay);
        continue;
      }

      // Se não for retryable ou for o último attempt, lançar erro
      throw error;
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa disso
  throw lastError;
}

/**
 * Wrapper para funções do Supabase com retry automático
 * 
 * @param supabaseFn - Função do Supabase que retorna { data, error }
 * @param options - Opções de retry
 * @returns Resultado da função com data e error
 * 
 * @example
 * ```typescript
 * const { data, error } = await retrySupabase(
 *   () => supabase.from('membros').select('*')
 * );
 * ```
 */
export async function retrySupabase<T>(
  supabaseFn: () => Promise<{ data: T | null; error: unknown }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: unknown }> {
  try {
    const result = await retry(supabaseFn, options);
    return result;
  } catch (error) {
    return { data: null, error };
  }
}
