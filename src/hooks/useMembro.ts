// ============================================================================
// Hook customizado para buscar membros com cargos
// ============================================================================
// Descrição: Hook React para buscar dados de membros incluindo seus cargos ativos
// Data: 2025-12-28
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Membro, Cargo, PadrinhoInfo } from '../types/database.types';

/**
 * Interface estendida de Membro com cargos incluídos
 */
export interface MembroComCargos extends Membro {
  cargos: Cargo[];
}

const fetchPadrinhoInfo = async (padrinhoId: string | null): Promise<PadrinhoInfo | null> => {
  if (!padrinhoId) return null;

  const { data, error } = await supabase
    .from('membros')
    .select('id, nome_guerra, foto_url')
    .eq('id', padrinhoId)
    .single();

  if (error) {
    console.warn('Erro ao buscar padrinho:', error.message);
    return null;
  }

  return data as PadrinhoInfo;
};

/**
 * Hook para buscar dados de um membro específico incluindo seus cargos ativos
 * 
 * @param membroId - ID do membro a ser buscado
 * @returns Objeto contendo o membro com cargos, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { membro, loading, refresh } = useMembro(membroId);
 * 
 * if (loading) return <Loader />;
 * if (!membro) return <NotFound />;
 * 
 * return <MembroCard membro={membro} />;
 * ```
 */
export function useMembro(membroId: string | null) {
  const [membro, setMembro] = useState<MembroComCargos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembro = async () => {
    if (!membroId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            data_atribuicao,
            ativo,
            observacao,
            cargos (
              id,
              nome,
              nivel,
              tipo_cargo,
              descricao,
              ativo
            )
          )
        `)
        .eq('id', membroId)
        .eq('membro_cargos.ativo', true)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Membro não encontrado');
      }

      const padrinhoInfo = await fetchPadrinhoInfo(data.padrinho_id || null);

      // Transformar dados para o formato esperado
      const membroComCargos: MembroComCargos = {
        ...data,
        cargos: data.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos)
          .sort((a: Cargo, b: Cargo) => a.nivel - b.nivel) || [],
        padrinho: padrinhoInfo
      };

      setMembro(membroComCargos);
    } catch (err) {
      console.error('Erro ao buscar membro:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setMembro(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembro();
  }, [membroId]);

  return { membro, loading, error, refresh: fetchMembro };
}

/**
 * Hook para buscar o membro atual (usuário logado) incluindo seus cargos
 * 
 * @param userId - ID do usuário autenticado
 * @returns Objeto contendo o membro com cargos, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { user } = useAuth();
 * const { membro, loading } = useMembroAtual(user?.id);
 * ```
 */
export function useMembroAtual(userId: string | undefined) {
  const [membro, setMembro] = useState<MembroComCargos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembro = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            data_atribuicao,
            ativo,
            observacao,
            cargos (
              id,
              nome,
              nivel,
              tipo_cargo,
              descricao,
              ativo
            )
          )
        `)
        .eq('user_id', userId)
        .eq('membro_cargos.ativo', true)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Membro não encontrado');
      }

      const padrinhoInfo = await fetchPadrinhoInfo(data.padrinho_id || null);

      // Transformar dados para o formato esperado
      const membroComCargos: MembroComCargos = {
        ...data,
        cargos: data.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos)
          .sort((a: Cargo, b: Cargo) => a.nivel - b.nivel) || [],
        padrinho: padrinhoInfo
      };

      setMembro(membroComCargos);
    } catch (err) {
      console.error('Erro ao buscar membro atual:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setMembro(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembro();
  }, [userId]);

  return { membro, loading, error, refresh: fetchMembro };
}

/**
 * Hook para buscar todos os membros ativos com seus cargos
 * 
 * @param apenasAtivos - Se true, retorna apenas membros ativos (padrão: true)
 * @returns Objeto contendo lista de membros, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { membros, loading } = useMembros();
 * 
 * return membros.map(membro => <MembroCard key={membro.id} membro={membro} />);
 * ```
 */
export function useMembros(apenasAtivos: boolean = true) {
  const [membros, setMembros] = useState<MembroComCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembros = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            data_atribuicao,
            ativo,
            observacao,
            cargos (
              id,
              nome,
              nivel,
              tipo_cargo,
              descricao,
              ativo
            )
          )
        `)
        .eq('membro_cargos.ativo', true)
        .order('nome_guerra', { ascending: true });

      if (apenasAtivos) {
        query = query.eq('ativo', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transformar dados para o formato esperado (incluindo padrinho)
      const membrosComCargos: MembroComCargos[] = await Promise.all((data || []).map(async (m: any) => {
        const padrinhoInfo = await fetchPadrinhoInfo(m.padrinho_id || null);
        return {
          ...m,
          cargos: m.membro_cargos
            ?.filter((mc: any) => mc.cargos && mc.ativo)
            .map((mc: any) => mc.cargos)
            .sort((a: Cargo, b: Cargo) => a.nivel - b.nivel) || [],
          padrinho: padrinhoInfo
        };
      }));

      setMembros(membrosComCargos);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setMembros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembros();
  }, [apenasAtivos]);

  return { membros, loading, error, refresh: fetchMembros };
}
