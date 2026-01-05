// ============================================================================
// Hook customizado para buscar integrantes com cargos
// ============================================================================
// Descrição: Hook React para buscar dados de integrantes incluindo seus cargos ativos
// Data: 2025-12-28
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Integrante, Cargo, PadrinhoInfo } from '../types/database.types';

/**
 * Interface estendida de Integrante com cargos incluídos
 */
export interface IntegranteComCargos extends Integrante {
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
 * Hook para buscar dados de um integrante específico incluindo seus cargos ativos
 * 
 * @param integranteId - ID do integrante a ser buscado
 * @returns Objeto contendo o integrante com cargos, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { integrante, loading, refresh } = useIntegrante(integranteId);
 * 
 * if (loading) return <Loader />;
 * if (!integrante) return <NotFound />;
 * 
 * return <IntegranteCard integrante={integrante} />;
 * ```
 */
export function useIntegrante(integranteId: string | null) {
  const [integrante, setIntegrante] = useState<IntegranteComCargos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntegrante = async () => {
    if (!integranteId) {
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
        .eq('id', integranteId)
        .eq('membro_cargos.ativo', true)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Integrante não encontrado');
      }

      const padrinhoInfo = await fetchPadrinhoInfo(data.padrinho_id || null);

      // Transformar dados para o formato esperado
      const integranteComCargos: IntegranteComCargos = {
        ...data,
        cargos: data.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos)
          .sort((a: Cargo, b: Cargo) => a.nivel - b.nivel) || [],
        padrinho: padrinhoInfo
      };

      setIntegrante(integranteComCargos);
    } catch (err) {
      console.error('Erro ao buscar integrante:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setIntegrante(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrante();
  }, [integranteId]);

  return { integrante, loading, error, refresh: fetchIntegrante };
}

/**
 * Hook para buscar o integrante atual (usuário logado) incluindo seus cargos
 * 
 * @param userId - ID do usuário autenticado
 * @returns Objeto contendo o integrante com cargos, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { user } = useAuth();
 * const { integrante, loading } = useIntegranteAtual(user?.id);
 * ```
 */
export function useIntegranteAtual(userId: string | undefined) {
  const [integrante, setIntegrante] = useState<IntegranteComCargos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntegrante = async () => {
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
        throw new Error('Integrante não encontrado');
      }

      const padrinhoInfo = await fetchPadrinhoInfo(data.padrinho_id || null);

      // Transformar dados para o formato esperado
      const integranteComCargos: IntegranteComCargos = {
        ...data,
        cargos: data.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos)
          .sort((a: Cargo, b: Cargo) => a.nivel - b.nivel) || [],
        padrinho: padrinhoInfo
      };

      setIntegrante(integranteComCargos);
    } catch (err) {
      console.error('Erro ao buscar integrante atual:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setIntegrante(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrante();
  }, [userId]);

  return { integrante, loading, error, refresh: fetchIntegrante };
}

/**
 * Hook para buscar todos os integrantes ativos com seus cargos
 * 
 * @param apenasAtivos - Se true, retorna apenas integrantes ativos (padrão: true)
 * @returns Objeto contendo lista de integrantes, estado de loading e função de refresh
 * 
 * @example
 * ```tsx
 * const { integrantes, loading } = useIntegrantes();
 * 
 * return integrantes.map(integrante => <IntegranteCard key={integrante.id} integrante={integrante} />);
 * ```
 */
export function useIntegrantes(apenasAtivos: boolean = true) {
  const [integrantes, setIntegrantes] = useState<IntegranteComCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIntegrantes = async () => {
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
      const integrantesComCargos: IntegranteComCargos[] = await Promise.all((data || []).map(async (m: any) => {
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

      setIntegrantes(integrantesComCargos);
    } catch (err) {
      console.error('Erro ao buscar integrantes:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setIntegrantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrantes();
  }, [apenasAtivos]);

  return { integrantes, loading, error, refresh: fetchIntegrantes };
}
