/**
 * Serviço para operações relacionadas a membros
 * Abstrai o acesso ao Supabase para a entidade de membros
 */
import { supabase } from '../lib/supabase';
import { Membro, MembroComCargos, Cargo, PadrinhoInfo } from '../types/database.types';

/**
 * Interface para resposta do Supabase ao buscar membro com relações
 */
interface MembroWithRelations {
  id: string;
  user_id: string;
  nome_completo: string;
  nome_guerra: string;
  padrinho_id: string | null;
  status_membro: string;
  numero_carteira: string;
  data_inicio: string | null;
  telefone: string | null;
  email: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  foto_url: string | null;
  tipo_sanguineo: string | null;
  ativo: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  membro_cargos?: Array<{
    id: string;
    ativo: boolean;
    cargos: Cargo | null;
  }>;
  conjuges?: Array<{
    nome_completo: string;
    nome_guerra: string;
  }>;
  padrinho?: PadrinhoInfo | null;
}

/**
 * Transforma dados do Supabase para MembroComCargos
 */
function transformMembroData(membroData: MembroWithRelations): MembroComCargos {
  return {
    ...membroData,
    cargos: membroData.membro_cargos
      ?.filter((mc) => mc.cargos !== null && mc.ativo)
      .map((mc) => mc.cargos as Cargo) || [],
    conjuge: membroData.conjuges && membroData.conjuges.length > 0 ? membroData.conjuges[0] : null,
    padrinho: membroData.padrinho || null,
  } as MembroComCargos;
}

export const membroService = {
  /**
   * Busca um membro pelo user_id (usado no Dashboard)
   */
  async buscarPorUserId(userId: string): Promise<MembroComCargos | null> {
    const { data, error } = await supabase
      .from('membros')
      .select(`
        *,
        membro_cargos (
          id,
          ativo,
          cargos (
            id,
            nome,
            tipo_cargo
          )
        ),
        conjuges (
          nome_completo,
          nome_guerra
        ),
        padrinho:membros!padrinho_id (
          nome_guerra
        )
      `)
      .eq('user_id', userId)
      .eq('membro_cargos.ativo', true)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar membro: ${error.message}`);
    }

    if (!data) return null;

    return transformMembroData(data as MembroWithRelations);
  },

  /**
   * Busca um membro pelo ID
   */
  async buscarPorId(membroId: string): Promise<MembroComCargos | null> {
    const { data, error } = await supabase
      .from('membros')
      .select(`
        *,
        membro_cargos (
          id,
          ativo,
          cargos (
            id,
            nome,
            tipo_cargo
          )
        )
      `)
      .eq('id', membroId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar membro: ${error.message}`);
    }

    if (!data) return null;

    return transformMembroData(data as MembroWithRelations);
  },

  /**
   * Busca apenas o ID do membro pelo user_id (para casos simples)
   */
  async buscarIdPorUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('membros')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return data.id;
  },
};
