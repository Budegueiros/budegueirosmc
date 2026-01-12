/**
 * Hook customizado para gerenciar o fluxo de caixa
 * Usa caixaService para abstrair acesso ao Supabase
 */
import { useState, useEffect, useCallback } from 'react';
import { caixaService, CriarLancamentoInput, AtualizarLancamentoInput } from '../services/caixaService';
import { FluxoCaixaComMembro } from '../types/database.types';
import { handleSupabaseError, logError } from '../utils/errorHandler';

export const useFluxoCaixa = () => {
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaComMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFluxoCaixa = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await caixaService.buscarTodos();
      setFluxoCaixa(data);
    } catch (err) {
      const appError = handleSupabaseError(err);
      setError(appError.message);
      logError(appError, { context: 'fetchFluxoCaixa' });
    } finally {
      setLoading(false);
    }
  }, []);

  const createLancamento = useCallback(async (lancamento: CriarLancamentoInput) => {
    try {
      const data = await caixaService.criar(lancamento);
      setFluxoCaixa(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const appError = handleSupabaseError(err);
      logError(appError, { context: 'createLancamento', lancamento });
      return { data: null, error: appError.message };
    }
  }, []);

  const updateLancamento = useCallback(async (id: string, dados: AtualizarLancamentoInput) => {
    try {
      const updated = await caixaService.atualizar(id, dados);
      setFluxoCaixa(prev => prev.map(l => l.id === id ? updated : l));
      return { data: updated, error: null };
    } catch (err) {
      const appError = handleSupabaseError(err);
      logError(appError, { context: 'updateLancamento', id, dados });
      return { data: null, error: appError.message };
    }
  }, []);

  const deleteLancamento = useCallback(async (id: string) => {
    try {
      await caixaService.deletar(id);
      setFluxoCaixa(prev => prev.filter(l => l.id !== id));
      return { error: null };
    } catch (err) {
      const appError = handleSupabaseError(err);
      logError(appError, { context: 'deleteLancamento', id });
      return { error: appError.message };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await caixaService.buscarTodos();
        if (!cancelled) {
          setFluxoCaixa(data);
        }
      } catch (err) {
        if (!cancelled) {
          const appError = handleSupabaseError(err);
          setError(appError.message);
          logError(appError, { context: 'useFluxoCaixa' });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    fluxoCaixa,
    loading,
    error,
    refetch: fetchFluxoCaixa,
    createLancamento,
    updateLancamento,
    deleteLancamento
  };
};

