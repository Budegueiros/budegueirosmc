import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FluxoCaixaComMembro } from '../types/database.types';

export const useFluxoCaixa = () => {
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaComMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFluxoCaixa = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      setFluxoCaixa((data || []) as FluxoCaixaComMembro[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar lançamentos');
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createLancamento = async (lancamento: {
    tipo: 'entrada' | 'saida';
    descricao: string;
    categoria: 'Combustível' | 'Sede' | 'Eventos' | 'Outros';
    valor: number;
    data: string;
    anexo_url?: string | null;
    membro_id: string;
  }) => {
    try {
      const { data, error: createError } = await supabase
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

      if (createError) throw createError;

      if (data) {
        setFluxoCaixa(prev => [data as FluxoCaixaComMembro, ...prev]);
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Erro ao criar lançamento:', err);
      return { data: null, error: err.message || 'Erro ao criar lançamento' };
    }
  };

  const updateLancamento = async (id: string, data: {
    descricao?: string;
    categoria?: string;
    valor?: number;
    data?: string;
    anexo_url?: string | null;
  }) => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('fluxo_caixa')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          membros!inner (
            nome_completo,
            nome_guerra
          )
        `)
        .single();

      if (updateError) throw updateError;

      if (updated) {
        setFluxoCaixa(prev => prev.map(l => l.id === id ? updated as FluxoCaixaComMembro : l));
      }

      return { data: updated, error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar lançamento:', err);
      return { data: null, error: err.message || 'Erro ao atualizar lançamento' };
    }
  };

  const deleteLancamento = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('fluxo_caixa')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setFluxoCaixa(prev => prev.filter(l => l.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Erro ao excluir lançamento:', err);
      return { error: err.message || 'Erro ao excluir lançamento' };
    }
  };

  useEffect(() => {
    fetchFluxoCaixa();
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

