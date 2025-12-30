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

/**
 * Prioridade de um comunicado
 */
export type ComunicadoPrioridade = 'normal' | 'alta' | 'critica';

/**
 * Tipo de destinatário do comunicado
 */
export type ComunicadoTipoDestinatario = 'geral' | 'cargo' | 'membro';

/**
 * Interface para comunicados
 */
export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: ComunicadoPrioridade;
  tipo_destinatario: ComunicadoTipoDestinatario;
  valor_destinatario: string | null;
  membro_id_autor: string;
  created_at: string;
}

/**
 * Interface para leitura de comunicados
 */
export interface ComunicadoLeitura {
  id: string;
  comunicado_id: string;
  membro_id: string;
  lido_em: string;
}

/**
 * Interface estendida com informações do autor
 */
export interface ComunicadoComAutor extends Comunicado {
  autor: {
    nome_guerra: string;
    foto_url: string | null;
  };
  ja_lido: boolean;
}

/**
 * Interface para fotos de eventos
 */
export interface EventoFoto {
  id: string;
  evento_id: string;
  foto_url: string;
  legenda: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para eventos
 */
export interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  distancia_km: number | null;
  foto_capa_url: string | null;
  cidade: string;
  estado: string;
  status: string;
  vagas_limitadas: boolean;
  max_participantes: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface estendida: Evento com suas fotos incluídas
 */
export interface EventoComFotos extends Evento {
  fotos: EventoFoto[];
}

