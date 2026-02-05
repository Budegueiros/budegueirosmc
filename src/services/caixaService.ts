/**
 * Serviço para operações relacionadas ao fluxo de caixa
 * Abstrai o acesso ao Supabase para a entidade de fluxo de caixa
 */
import { supabase } from '../lib/supabase';
import { FluxoCaixa, FluxoCaixaComMembro, CategoriaFluxoCaixa } from '../types/database.types';
import { handleSupabaseError } from '../utils/errorHandler';

/**
 * Interface para criar um novo lançamento
 */
export interface CriarLancamentoInput {
  tipo: 'entrada' | 'saida';
  descricao: string;
  categoria: CategoriaFluxoCaixa;
  valor: number;
  data: string;
  anexo_url?: string | null;
  membro_id: string;
}

/**
 * Interface para atualizar um lançamento
 */
export interface AtualizarLancamentoInput {
  descricao?: string;
  categoria?: CategoriaFluxoCaixa;
  valor?: number;
  data?: string;
  anexo_url?: string | null;
}

/**
 * Interface para categoria de fluxo de caixa
 */
export interface CategoriaFluxoCaixaData {
  nome: string;
  tipo: 'entrada' | 'saida';
}

export const caixaService = {
  /**
   * Busca todos os lançamentos do fluxo de caixa com informações do membro
   */
  async buscarTodos(): Promise<FluxoCaixaComMembro[]> {
    const { data, error } = await supabase
      .from('fluxo_caixa')
      .select(`
        *,
        membros!inner (
          nome_completo,
          nome_guerra
        )
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []) as FluxoCaixaComMembro[];
  },

  /**
   * Busca um lançamento por ID
   */
  async buscarPorId(id: string): Promise<FluxoCaixaComMembro | null> {
    const { data, error } = await supabase
      .from('fluxo_caixa')
      .select(`
        *,
        membros!inner (
          nome_completo,
          nome_guerra
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    return data as FluxoCaixaComMembro | null;
  },

  /**
   * Cria um novo lançamento
   */
  async criar(lancamento: CriarLancamentoInput): Promise<FluxoCaixaComMembro> {
    const { data, error } = await supabase
      .from('fluxo_caixa')
      .insert([lancamento])
      .select(`
        *,
        membros!inner (
          nome_completo,
          nome_guerra
        )
      `)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao criar lançamento: nenhum dado retornado');
    }

    return data as FluxoCaixaComMembro;
  },

  /**
   * Atualiza um lançamento existente
   */
  async atualizar(id: string, dados: AtualizarLancamentoInput): Promise<FluxoCaixaComMembro> {
    const { data, error } = await supabase
      .from('fluxo_caixa')
      .update(dados)
      .eq('id', id)
      .select(`
        *,
        membros!inner (
          nome_completo,
          nome_guerra
        )
      `)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao atualizar lançamento: nenhum dado retornado');
    }

    return data as FluxoCaixaComMembro;
  },

  /**
   * Deleta um lançamento
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('fluxo_caixa')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }
  },

  /**
   * Busca todas as categorias ativas de fluxo de caixa
   */
  async buscarCategorias(): Promise<CategoriaFluxoCaixaData[]> {
    const { data, error } = await supabase
      .from('categorias_fluxo_caixa')
      .select('nome, tipo')
      .eq('ativo', true)
      .order('tipo')
      .order('ordem');

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []) as CategoriaFluxoCaixaData[];
  },
};
