/**
 * Testes unitários para membroService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { membroService } from '../membroService';
import { supabase } from '../../lib/supabase';

// Mock do Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

/**
 * Cria um query builder encadeável (select/eq retornam o próprio builder)
 * que resolve em `single()` com o resultado informado
 */
function mockQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  (supabase.from as any).mockReturnValue(builder);
  return builder;
}

describe('membroService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarPorUserId', () => {
    it('deve buscar membro por user_id com sucesso', async () => {
      const mockMembro = {
        id: 'membro-1',
        user_id: 'user-1',
        nome_completo: 'João Silva',
        nome_guerra: 'João',
        padrinho_id: null,
        status_membro: 'Brasionado',
        numero_carteira: '001',
        data_inicio: null,
        telefone: null,
        email: 'joao@example.com',
        endereco_cidade: null,
        endereco_estado: null,
        foto_url: null,
        tipo_sanguineo: null,
        ativo: true,
        is_admin: false,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        membro_cargos: [
          {
            id: 'mc-1',
            ativo: true,
            cargos: {
              id: 'cargo-1',
              nome: 'Brasionado',
              tipo_cargo: 'Operacional',
            },
          },
        ],
        conjuges: [],
        padrinho: null,
      };

      const builder = mockQueryBuilder({ data: mockMembro, error: null });

      const result = await membroService.buscarPorUserId('user-1');

      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(builder.eq).toHaveBeenCalledWith('membro_cargos.ativo', true);

      expect(result).toBeTruthy();
      expect(result?.id).toBe('membro-1');
      expect(result?.nome_completo).toBe('João Silva');
      expect(supabase.from).toHaveBeenCalledWith('membros');
    });

    it('deve retornar null quando membro não encontrado', async () => {
      mockQueryBuilder({ data: null, error: null });

      const result = await membroService.buscarPorUserId('user-inexistente');

      expect(result).toBeNull();
    });

    it('deve lançar erro quando ocorre erro no Supabase', async () => {
      const mockError = { message: 'Erro ao buscar membro', code: 'PGRST116' };

      mockQueryBuilder({ data: null, error: mockError });

      await expect(membroService.buscarPorUserId('user-1')).rejects.toThrow(
        'Erro ao buscar membro: Erro ao buscar membro'
      );
    });
  });

  describe('buscarIdPorUserId', () => {
    it('deve retornar apenas o ID do membro', async () => {
      const mockData = { id: 'membro-1' };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await membroService.buscarIdPorUserId('user-1');

      expect(result).toBe('membro-1');
    });

    it('deve retornar null quando membro não encontrado', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await membroService.buscarIdPorUserId('user-inexistente');

      expect(result).toBeNull();
    });
  });
});
