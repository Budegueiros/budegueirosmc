/**
 * Testes unitários para errorHandler
 */
import { describe, it, expect } from 'vitest';
import { AppError, handleSupabaseError, getFriendlyErrorMessage } from '../errorHandler';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('deve criar uma instância de AppError corretamente', () => {
      const error = new AppError('Mensagem de erro', 'ERROR_CODE', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Mensagem de erro');
      expect(error.code).toBe('ERROR_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });
  });

  describe('handleSupabaseError', () => {
    it('deve tratar erro do Supabase com código', () => {
      const supabaseError = new Error('Registro não encontrado');
      (supabaseError as any).code = 'PGRST116';
      (supabaseError as any).status = 404;

      const result = handleSupabaseError(supabaseError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Registro não encontrado');
      expect(result.code).toBe('PGRST116');
      expect(result.statusCode).toBe(404);
    });

    it('deve tratar erro genérico do Error', () => {
      const genericError = new Error('Erro genérico');

      const result = handleSupabaseError(genericError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Erro genérico');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('deve tratar erro desconhecido', () => {
      const unknownError = 'String error';

      const result = handleSupabaseError(unknownError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Erro desconhecido');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getFriendlyErrorMessage', () => {
    it('deve retornar mensagem amigável para erro de rede', () => {
      const networkError = new Error('network error');
      const message = getFriendlyErrorMessage(networkError);

      expect(message).toContain('conexão');
    });

    it('deve retornar mensagem amigável para erro de timeout', () => {
      const timeoutError = new Error('Request timeout');
      const message = getFriendlyErrorMessage(timeoutError);

      expect(message).toContain('demorou muito');
    });

    it('deve retornar mensagem do AppError quando disponível', () => {
      const appError = new AppError('Erro customizado', 'CUSTOM_ERROR');
      const message = getFriendlyErrorMessage(appError);

      expect(message).toBe('Erro customizado');
    });

    it('deve retornar mensagem padrão para erro desconhecido', () => {
      const unknownError = 'Unknown';
      const message = getFriendlyErrorMessage(unknownError);

      expect(message).toContain('erro inesperado');
    });
  });
});
