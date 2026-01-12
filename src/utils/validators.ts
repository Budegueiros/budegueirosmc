/**
 * Schemas de validação usando Zod
 * Validação client-side para formulários
 */
import { z } from 'zod';

/**
 * Schema para validação de membro
 */
export const membroSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  nome_guerra: z.string().min(2, 'Nome de guerra é obrigatório').max(50, 'Nome de guerra muito longo'),
  email: z.string().email('Email inválido'),
  telefone: z.string().nullable().optional(),
  endereco_cidade: z.string().nullable().optional(),
  endereco_estado: z.string().nullable().optional(),
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  status_membro: z.enum(['Aspirante', 'Prospect', 'Brasionado', 'Nomade']),
  numero_carteira: z.string().min(1, 'Número da carteira é obrigatório'),
});

export type MembroFormData = z.infer<typeof membroSchema>;

/**
 * Schema para validação de evento
 */
export const eventoSchema = z.object({
  nome: z.string().min(3, 'Nome do evento deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  descricao: z.string().nullable().optional(),
  data_evento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD'),
  hora_saida: z.string().nullable().optional(),
  local_saida: z.string().min(1, 'Local de saída é obrigatório'),
  local_destino: z.string().nullable().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  distancia_km: z.number().min(0, 'Distância não pode ser negativa').nullable().optional(),
  tipo_evento: z.string().min(1, 'Tipo de evento é obrigatório'),
  status: z.enum(['Ativo', 'Finalizado', 'Cancelado']),
  vagas_limitadas: z.boolean(),
  max_participantes: z.number().int().positive('Número máximo de participantes deve ser positivo').nullable().optional(),
  observacoes: z.string().nullable().optional(),
  evento_principal: z.boolean(),
});

export type EventoFormData = z.infer<typeof eventoSchema>;

/**
 * Schema para validação de mensalidade
 */
export const mensalidadeSchema = z.object({
  membro_id: z.string().uuid('ID do membro inválido'),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/, 'Mês de referência deve estar no formato YYYY-MM'),
  valor: z.number().positive('Valor deve ser positivo'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida'),
  link_cobranca: z.string().url('Link de cobrança inválido').nullable().optional(),
  forma_pagamento: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

export type MensalidadeFormData = z.infer<typeof mensalidadeSchema>;

/**
 * Schema para validação de fluxo de caixa
 */
export const fluxoCaixaSchema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').max(200, 'Descrição muito longa'),
  categoria: z.enum([
    'Mensalidade',
    'Doação',
    'Venda',
    'Evento',
    'Combustível',
    'Sede',
    'Eventos',
    'Outros',
  ]),
  valor: z.number().positive('Valor deve ser positivo'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  membro_id: z.string().uuid('ID do membro inválido'),
  anexo_url: z.string().url('URL do anexo inválida').nullable().optional(),
});

export type FluxoCaixaFormData = z.infer<typeof fluxoCaixaSchema>;

/**
 * Schema para validação de comunicado
 */
export const comunicadoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título muito longo'),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  prioridade: z.enum(['normal', 'alta', 'critica']),
  tipo_destinatario: z.enum(['geral', 'cargo', 'membro']),
  valor_destinatario: z.string().nullable().optional(),
  membro_id_autor: z.string().uuid('ID do autor inválido'),
});

export type ComunicadoFormData = z.infer<typeof comunicadoSchema>;

/**
 * Helper para validar dados e retornar erros formatados
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  if (result.error && result.error.errors) {
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
  }

  return { success: false, errors };
}
