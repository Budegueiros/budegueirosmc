// ============================================================================
// Hook para Gerenciamento de Membros (CRUD)
// ============================================================================
// Descrição: Hook React para operações CRUD de membros
// Data: 2025-01-XX
// ============================================================================

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Membro, StatusMembroEnum } from '../types/database.types';

export interface UpdateMemberData {
  nome_completo?: string;
  nome_guerra?: string;
  status_membro?: StatusMembroEnum;
  numero_carteira?: string;
  data_inicio?: string | null;
  telefone?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  foto_url?: string | null;
  padrinho_id?: string | null;
}

export interface UseManageMembersReturn {
  updateMember: (membroId: string, data: UpdateMemberData) => Promise<void>;
  toggleActive: (membroId: string, currentStatus: boolean) => Promise<boolean>;
  toggleAdmin: (membroId: string, currentStatus: boolean) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para gerenciar operações CRUD de membros
 * 
 * @returns Objeto com funções de CRUD e estados de loading/error
 * 
 * @example
 * ```tsx
 * const { updateMember, toggleActive, loading } = useManageMembers();
 * 
 * await updateMember(membroId, { nome_completo: 'Novo Nome' });
 * ```
 */
export function useManageMembers(): UseManageMembersReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Atualiza dados de um membro
   */
  const updateMember = async (membroId: string, data: UpdateMemberData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Preparar dados para update (remover undefined)
      const updateData: Partial<UpdateMemberData> = {};
      
      if (data.nome_completo !== undefined) updateData.nome_completo = data.nome_completo;
      if (data.nome_guerra !== undefined) updateData.nome_guerra = data.nome_guerra.toUpperCase();
      if (data.status_membro !== undefined) updateData.status_membro = data.status_membro;
      if (data.numero_carteira !== undefined) updateData.numero_carteira = data.numero_carteira;
      if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio;
      if (data.telefone !== undefined) updateData.telefone = data.telefone;
      if (data.endereco_cidade !== undefined) updateData.endereco_cidade = data.endereco_cidade;
      if (data.endereco_estado !== undefined) updateData.endereco_estado = data.endereco_estado;
      if (data.foto_url !== undefined) updateData.foto_url = data.foto_url;
      if (data.padrinho_id !== undefined) updateData.padrinho_id = data.padrinho_id;

      const { error: updateError } = await supabase
        .from('membros')
        .update(updateData)
        .eq('id', membroId);

      if (updateError) throw updateError;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar membro');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Alterna status ativo/inativo de um membro
   */
  const toggleActive = async (membroId: string, currentStatus: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('membros')
        .update({ ativo: !currentStatus })
        .eq('id', membroId);

      if (updateError) throw updateError;

      return !currentStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao alterar status do membro');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Alterna privilégios de administrador de um membro
   */
  const toggleAdmin = async (membroId: string, currentStatus: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('membros')
        .update({ is_admin: !currentStatus })
        .eq('id', membroId);

      if (updateError) throw updateError;

      return !currentStatus;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao alterar privilégios de administrador');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateMember,
    toggleActive,
    toggleAdmin,
    loading,
    error,
  };
}

