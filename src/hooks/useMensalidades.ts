/**
 * Hook customizado para gerenciar mensalidades
 * Usa mensalidadeService para abstrair acesso ao Supabase
 */
import { useState, useEffect, useCallback } from 'react';
import { mensalidadeService, MensalidadeData } from '../services/mensalidadeService';
import { calcularStatus } from '../utils/mensalidadesHelpers';
import { handleSupabaseError, logError } from '../utils/errorHandler';

export const useMensalidades = () => {
  const [mensalidades, setMensalidades] = useState<MensalidadeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMensalidades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await mensalidadeService.buscarTodas();

      // Calcular status baseado na data
      const mensalidadesComStatus = data.map(m => ({
        ...m,
        status: calcularStatus(m)
      }));

      setMensalidades(mensalidadesComStatus);
    } catch (err) {
      const appError = handleSupabaseError(err);
      setError(appError.message);
      logError(appError, { context: 'fetchMensalidades' });
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMensalidade = useCallback(async (id: string) => {
    try {
      await mensalidadeService.deletar(id);
      setMensalidades(prev => prev.filter(m => m.id !== id));
      return { error: null };
    } catch (err) {
      const appError = handleSupabaseError(err);
      logError(appError, { context: 'deleteMensalidade', id });
      return { error: appError.message };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await mensalidadeService.buscarTodas();
        
        if (!cancelled) {
          const mensalidadesComStatus = data.map(m => ({
            ...m,
            status: calcularStatus(m)
          }));
          setMensalidades(mensalidadesComStatus);
        }
      } catch (err) {
        if (!cancelled) {
          const appError = handleSupabaseError(err);
          setError(appError.message);
          logError(appError, { context: 'useMensalidades' });
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
    mensalidades,
    loading,
    error,
    refetch: fetchMensalidades,
    deleteMensalidade
  };
};

