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

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockMembro,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await membroService.buscarPorUserId('user-1');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('membro-1');
      expect(result?.nome_completo).toBe('João Silva');
      expect(supabase.from).toHaveBeenCalledWith('membros');
    });

    it('deve retornar null quando membro não encontrado', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await membroService.buscarPorUserId('user-inexistente');

      expect(result).toBeNull();
    });

    it('deve lançar erro quando ocorre erro no Supabase', async () => {
      const mockError = { message: 'Erro ao buscar membro', code: 'PGRST116' };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      await expect(membroService.buscarPorUserId('user-1')).rejects.toThrow();
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
