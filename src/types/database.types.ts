// ============================================================================
// Tipos do Banco de Dados - Budegueiros MC
// ============================================================================
// Gerado após refatoração do sistema de Status e Cargos
// Data: 2025-12-28
// ============================================================================

/**
 * Status possíveis de um membro no Moto Clube
 */
export type StatusMembroEnum = 
  | 'Aspirante'
  | 'Prospect'
  | 'Brasionado'
  | 'Nomade';

/**
 * Tipos de cargo disponíveis
 */
export type TipoCargoEnum = 
  | 'Administrativo'
  | 'Operacional'
  | 'Honorario';

/**
 * Interface base para membros
 */
export interface Membro {
  id: string;
  user_id: string;
  nome_completo: string;
  nome_guerra: string;
  status_membro: StatusMembroEnum;
  numero_carteira: string;
  data_inicio: string | null;
  telefone: string | null;
  email: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  foto_url: string | null;
  ativo: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para cargos
 */
export interface Cargo {
  id: string;
  nome: string;
  nivel: number;
  tipo_cargo: TipoCargoEnum;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para relacionamento membro-cargo
 */
export interface MembroCargo {
  id: string;
  membro_id: string;
  cargo_id: string;
  data_atribuicao: string;
  ativo: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface estendida: Membro com seus cargos incluídos
 */
export interface MembroComCargos extends Membro {
  cargos: Cargo[];
}

/**
 * Interface para dados do join membro_cargos
 */
export interface MembroCargoJoin {
  id: string;
  data_atribuicao: string;
  ativo: boolean;
  observacao: string | null;
  cargos: Cargo;
}

/**
 * Helper para verificar se um valor é um status válido
 */
export function isStatusMembro(value: string): value is StatusMembroEnum {
  return ['Aspirante', 'Prospect', 'Brasionado', 'Nomade'].includes(value);
}

/**
 * Helper para verificar se um valor é um tipo de cargo válido
 */
export function isTipoCargo(value: string): value is TipoCargoEnum {
  return ['Administrativo', 'Operacional', 'Honorario'].includes(value);
}

/**
 * Cores e estilos para cada status
 */
export const STATUS_STYLES: Record<StatusMembroEnum, { bg: string; text: string; label: string }> = {
  Aspirante: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Aspirante'
  },
  Prospect: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Prospect'
  },
  Brasionado: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Brasionado'
  },
  Nomade: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Nômade'
  }
};

/**
 * Cores para cada tipo de cargo
 */
export const TIPO_CARGO_STYLES: Record<TipoCargoEnum, { bg: string; text: string }> = {
  Administrativo: {
    bg: 'bg-red-100',
    text: 'text-red-800'
  },
  Operacional: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800'
  },
  Honorario: {
    bg: 'bg-amber-100',
    text: 'text-amber-800'
  }
};
