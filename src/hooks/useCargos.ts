// ============================================================================
// Hook para Gerenciamento de Cargos (CRUD)
// ============================================================================
// Descrição: Hook React para operações CRUD de cargos
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Cargo, TipoCargoEnum } from '../types/database.types';

export interface CargoComEstatisticas extends Cargo {
  membros_count: number;
}

export interface CreateCargoData {
  nome: string;
  nivel: number;
  tipo_cargo: TipoCargoEnum;
  descricao: string | null;
  ativo: boolean;
}

export interface UpdateCargoData {
  nome?: string;
  nivel?: number;
  tipo_cargo?: TipoCargoEnum;
  descricao?: string | null;
  ativo?: boolean;
}

export interface UseCargosReturn {
  cargos: CargoComEstatisticas[];
  loading: boolean;
  error: Error | null;
  fetchCargos: () => Promise<void>;
  createCargo: (data: CreateCargoData) => Promise<Cargo>;
  updateCargo: (cargoId: string, data: UpdateCargoData) => Promise<void>;
  deleteCargo: (cargoId: string) => Promise<void>;
  toggleCargoStatus: (cargoId: string, currentStatus: boolean) => Promise<boolean>;
}

/**
 * Hook para gerenciar operações CRUD de cargos
 * 
 * @returns Objeto com lista de cargos, estados de loading/error e funções de CRUD
 * 
 * @example
 * ```tsx
 * const { cargos, loading, fetchCargos, createCargo } = useCargos();
 * 
 * useEffect(() => {
 *   fetchCargos();
 * }, []);
 * 
 * await createCargo({ nome: 'Presidente', nivel: 1, tipo_cargo: 'Administrativo', descricao: null, ativo: true });
 * ```
 */
export function useCargos(): UseCargosReturn {
  const [cargos, setCargos] = useState<CargoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Busca todos os cargos com contagem de membros vinculados
   */
  const fetchCargos = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Carregar todos os cargos ordenados por nível
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('*')
        .order('nivel', { ascending: true });

      if (cargosError) throw cargosError;

      // Para cada cargo, contar quantos membros ativos têm esse cargo
      const cargosComStats = await Promise.all(
        (cargosData || []).map(async (cargo: Cargo) => {
          const { count } = await supabase
            .from('membro_cargos')
            .select('*', { count: 'exact', head: true })
            .eq('cargo_id', cargo.id)
            .eq('ativo', true);

          return {
            ...cargo,
            membros_count: count || 0
          };
        })
      );

      setCargos(cargosComStats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar cargos');
      setError(error);
      console.error('Erro ao carregar cargos:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um novo cargo
   */
  const createCargo = async (data: CreateCargoData): Promise<Cargo> => {
    setLoading(true);
    setError(null);

    try {
      const { data: newCargo, error: createError } = await supabase
        .from('cargos')
        .insert({
          nome: data.nome.trim(),
          nivel: data.nivel,
          tipo_cargo: data.tipo_cargo,
          descricao: data.descricao?.trim() || null,
          ativo: data.ativo
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newCargo) throw new Error('Cargo não foi criado');

      // Recarregar lista de cargos
      await fetchCargos();

      return newCargo;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar cargo');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza um cargo existente
   */
  const updateCargo = async (cargoId: string, data: UpdateCargoData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Preparar dados para update (remover undefined)
      const updateData: Partial<UpdateCargoData> = {};

      if (data.nome !== undefined) updateData.nome = data.nome.trim();
      if (data.nivel !== undefined) updateData.nivel = data.nivel;
      if (data.tipo_cargo !== undefined) updateData.tipo_cargo = data.tipo_cargo;
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;

      const { error: updateError } = await supabase
        .from('cargos')
        .update(updateData)
        .eq('id', cargoId);

      if (updateError) throw updateError;

      // Recarregar lista de cargos
      await fetchCargos();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar cargo');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deleta um cargo (com validação de membros vinculados)
   */
  const deleteCargo = async (cargoId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se há membros vinculados
      const { count } = await supabase
        .from('membro_cargos')
        .select('*', { count: 'exact', head: true })
        .eq('cargo_id', cargoId)
        .eq('ativo', true);

      if (count && count > 0) {
        throw new Error(`Não é possível deletar o cargo. Existem ${count} membro(s) vinculado(s).`);
      }

      const { error: deleteError } = await supabase
        .from('cargos')
        .delete()
        .eq('id', cargoId);

      if (deleteError) throw deleteError;

      // Recarregar lista de cargos
      await fetchCargos();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar cargo');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Alterna status ativo/inativo de um cargo
   */
  const toggleCargoStatus = async (cargoId: string, currentStatus: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('cargos')
        .update({ ativo: !currentStatus })
        .eq('id', cargoId);

      if (updateError) throw updateError;

      // Recarregar lista de cargos
      await fetchCargos();

      return !currentStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao alterar status do cargo');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    cargos,
    loading,
    error,
    fetchCargos,
    createCargo,
    updateCargo,
    deleteCargo,
    toggleCargoStatus,
  };
}


