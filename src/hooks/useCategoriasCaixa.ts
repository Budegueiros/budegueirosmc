// ============================================================================
// Hook para Gerenciamento de Categorias do Fluxo de Caixa (CRUD)
// ============================================================================
// Descrição: Hook React para operações CRUD de categorias do fluxo de caixa
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TipoFluxoCaixa } from '../types/database.types';

export interface CategoriaFluxoCaixa {
  id: string;
  nome: string;
  tipo: TipoFluxoCaixa;
  cor: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CategoriaComEstatisticas extends CategoriaFluxoCaixa {
  lancamentos_count: number;
}

export interface CreateCategoriaData {
  nome: string;
  tipo: TipoFluxoCaixa;
  cor?: string | null;
  descricao?: string | null;
  ativo?: boolean;
  ordem?: number;
}

export interface UpdateCategoriaData {
  nome?: string;
  tipo?: TipoFluxoCaixa;
  cor?: string | null;
  descricao?: string | null;
  ativo?: boolean;
  ordem?: number;
}

export interface UseCategoriasCaixaReturn {
  categorias: CategoriaComEstatisticas[];
  loading: boolean;
  error: Error | null;
  fetchCategorias: () => Promise<void>;
  createCategoria: (data: CreateCategoriaData) => Promise<CategoriaFluxoCaixa>;
  updateCategoria: (categoriaId: string, data: UpdateCategoriaData) => Promise<void>;
  deleteCategoria: (categoriaId: string) => Promise<void>;
  toggleCategoriaStatus: (categoriaId: string, currentStatus: boolean) => Promise<boolean>;
}

/**
 * Hook para gerenciar operações CRUD de categorias do fluxo de caixa
 */
export function useCategoriasCaixa(): UseCategoriasCaixaReturn {
  const [categorias, setCategorias] = useState<CategoriaComEstatisticas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Busca todas as categorias com contagem de lançamentos vinculados
   */
  const fetchCategorias = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Carregar todas as categorias ordenadas por tipo e ordem
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_fluxo_caixa')
        .select('*')
        .order('tipo', { ascending: true })
        .order('ordem', { ascending: true });

      if (categoriasError) throw categoriasError;

      // Para cada categoria, contar quantos lançamentos usam essa categoria
      const categoriasComStats = await Promise.all(
        (categoriasData || []).map(async (categoria: CategoriaFluxoCaixa) => {
          const { count } = await supabase
            .from('fluxo_caixa')
            .select('*', { count: 'exact', head: true })
            .eq('categoria', categoria.nome);

          return {
            ...categoria,
            lancamentos_count: count || 0
          };
        })
      );

      setCategorias(categoriasComStats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar categorias');
      setError(error);
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria uma nova categoria
   */
  const createCategoria = async (data: CreateCategoriaData): Promise<CategoriaFluxoCaixa> => {
    setLoading(true);
    setError(null);

    try {
      const { data: newCategoria, error: createError } = await supabase
        .from('categorias_fluxo_caixa')
        .insert({
          nome: data.nome.trim(),
          tipo: data.tipo,
          cor: data.cor || null,
          descricao: data.descricao?.trim() || null,
          ativo: data.ativo !== undefined ? data.ativo : true,
          ordem: data.ordem || 0
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newCategoria) throw new Error('Categoria não foi criada');

      // Recarregar lista de categorias
      await fetchCategorias();

      return newCategoria;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar categoria');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza uma categoria existente
   */
  const updateCategoria = async (categoriaId: string, data: UpdateCategoriaData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: Partial<UpdateCategoriaData> = {};

      if (data.nome !== undefined) updateData.nome = data.nome.trim();
      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.cor !== undefined) updateData.cor = data.cor;
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.ordem !== undefined) updateData.ordem = data.ordem;

      const { error: updateError } = await supabase
        .from('categorias_fluxo_caixa')
        .update(updateData)
        .eq('id', categoriaId);

      if (updateError) throw updateError;

      // Recarregar lista de categorias
      await fetchCategorias();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar categoria');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deleta uma categoria (com validação de lançamentos vinculados)
   */
  const deleteCategoria = async (categoriaId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Buscar nome da categoria
      const { data: categoria, error: fetchError } = await supabase
        .from('categorias_fluxo_caixa')
        .select('nome')
        .eq('id', categoriaId)
        .single();

      if (fetchError) throw fetchError;

      // Verificar se há lançamentos vinculados
      const { count } = await supabase
        .from('fluxo_caixa')
        .select('*', { count: 'exact', head: true })
        .eq('categoria', categoria.nome);

      if (count && count > 0) {
        throw new Error(`Não é possível deletar a categoria. Existem ${count} lançamento(s) vinculado(s).`);
      }

      const { error: deleteError } = await supabase
        .from('categorias_fluxo_caixa')
        .delete()
        .eq('id', categoriaId);

      if (deleteError) throw deleteError;

      // Recarregar lista de categorias
      await fetchCategorias();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar categoria');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Alterna status ativo/inativo de uma categoria
   */
  const toggleCategoriaStatus = async (categoriaId: string, currentStatus: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('categorias_fluxo_caixa')
        .update({ ativo: !currentStatus })
        .eq('id', categoriaId);

      if (updateError) throw updateError;

      // Recarregar lista de categorias
      await fetchCategorias();

      return !currentStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao alterar status da categoria');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    categorias,
    loading,
    error,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    toggleCategoriaStatus,
  };
}

