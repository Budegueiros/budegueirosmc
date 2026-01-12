/**
 * Testes unitários para validators
 */
import { describe, it, expect } from 'vitest';
import { validateFormData, membroSchema, eventoSchema, fluxoCaixaSchema } from '../validators';

describe('validators', () => {
  describe('membroSchema', () => {
    it('deve validar dados corretos de membro', () => {
      const validData = {
        nome_completo: 'João Silva',
        nome_guerra: 'João',
        email: 'joao@example.com',
        telefone: '11999999999',
        status_membro: 'Brasionado' as const,
        numero_carteira: '001',
      };

      const result = validateFormData(membroSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome_completo).toBe('João Silva');
      }
    });

    it('deve rejeitar nome muito curto', () => {
      const invalidData = {
        nome_completo: 'Jo',
        nome_guerra: 'João',
        email: 'joao@example.com',
        status_membro: 'Brasionado' as const,
        numero_carteira: '001',
      };

      const result = validateFormData(membroSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors['nome_completo']).toBeDefined();
      }
    });

    it('deve rejeitar email inválido', () => {
      const invalidData = {
        nome_completo: 'João Silva',
        nome_guerra: 'João',
        email: 'email-invalido',
        status_membro: 'Brasionado' as const,
        numero_carteira: '001',
      };

      const result = validateFormData(membroSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors['email']).toBeDefined();
      }
    });
  });

  describe('eventoSchema', () => {
    it('deve validar dados corretos de evento', () => {
      const validData = {
        nome: 'Role de Teste',
        data_evento: '2025-12-31',
        local_saida: 'Sede',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo_evento: 'Role',
        status: 'Ativo' as const,
        vagas_limitadas: false,
        evento_principal: true,
      };

      const result = validateFormData(eventoSchema, validData);

      expect(result.success).toBe(true);
    });

    it('deve rejeitar data inválida', () => {
      const invalidData = {
        nome: 'Role de Teste',
        data_evento: '31-12-2025', // Formato inválido
        local_saida: 'Sede',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo_evento: 'Role',
        status: 'Ativo' as const,
        vagas_limitadas: false,
        evento_principal: true,
      };

      const result = validateFormData(eventoSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors['data_evento']).toBeDefined();
      }
    });
  });

  describe('fluxoCaixaSchema', () => {
    it('deve validar dados corretos de fluxo de caixa', () => {
      const validData = {
        tipo: 'entrada' as const,
        descricao: 'Mensalidade de teste',
        categoria: 'Mensalidade' as const,
        valor: 100.0,
        data: '2025-01-15',
        membro_id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
      };

      const result = validateFormData(fluxoCaixaSchema, validData);

      expect(result.success).toBe(true);
    });

    it('deve rejeitar valor negativo', () => {
      const invalidData = {
        tipo: 'entrada' as const,
        descricao: 'Mensalidade de teste',
        categoria: 'Mensalidade' as const,
        valor: -100.0,
        data: '2025-01-15',
        membro_id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
      };

      const result = validateFormData(fluxoCaixaSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors['valor']).toBeDefined();
      }
    });
  });
});
