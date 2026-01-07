import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calcularStatus } from '../utils/mensalidadesHelpers';

interface Mensalidade {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  link_cobranca: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

export const useMensalidades = () => {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMensalidades = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('mensalidades')
        .select(`
          *,
          membros!inner (
            nome_completo,
            nome_guerra,
            numero_carteira
          )
        `)
        .order('data_vencimento', { ascending: false });

      if (fetchError) throw fetchError;

      // Calcular status baseado na data
      const mensalidadesComStatus = (data || []).map(m => ({
        ...m,
        status: calcularStatus(m)
      }));

      setMensalidades(mensalidadesComStatus);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar mensalidades');
      console.error('Erro ao buscar mensalidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMensalidade = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('mensalidades')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMensalidades(prev => prev.filter(m => m.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Erro ao excluir mensalidade:', err);
      return { error: err.message || 'Erro ao excluir mensalidade' };
    }
  };

  useEffect(() => {
    fetchMensalidades();
  }, []);

  return {
    mensalidades,
    loading,
    error,
    refetch: fetchMensalidades,
    deleteMensalidade
  };
};

