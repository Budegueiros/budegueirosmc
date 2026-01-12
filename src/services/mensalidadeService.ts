/**
 * Serviço para operações relacionadas a mensalidades
 * Abstrai o acesso ao Supabase para a entidade de mensalidades
 */
import { supabase } from '../lib/supabase';

/**
 * Interface para dados de uma mensalidade
 */
export interface MensalidadeData {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Aberto';
  created_at: string;
  membros?: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

export const mensalidadeService = {
  /**
   * Busca todas as mensalidades de um membro
   */
  async buscarPorMembroId(membroId: string): Promise<MensalidadeData[]> {
    const { data, error } = await supabase
      .from('mensalidades')
      .select('*')
      .eq('membro_id', membroId)
      .order('mes_referencia', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar mensalidades: ${error.message}`);
    }

    return (data || []) as MensalidadeData[];
  },

  /**
   * Busca todas as mensalidades com informações dos membros
   */
  async buscarTodas(): Promise<MensalidadeData[]> {
    const { data, error } = await supabase
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

    if (error) {
      throw new Error(`Erro ao buscar mensalidades: ${error.message}`);
    }

    return (data || []) as MensalidadeData[];
  },

  /**
   * Deleta uma mensalidade
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('mensalidades')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar mensalidade: ${error.message}`);
    }
  },

  /**
   * Filtra mensalidades atrasadas
   */
  filtrarAtrasadas(mensalidades: MensalidadeData[]): MensalidadeData[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return mensalidades.filter((m) => {
      if (m.status === 'Pago') return false;

      // Criar data no timezone local para evitar problemas de timezone
      const dateStr = m.data_vencimento.split('T')[0];
      const [ano, mes, dia] = dateStr.split('-').map(Number);
      const vencimento = new Date(ano, mes - 1, dia);
      vencimento.setHours(0, 0, 0, 0);

      return vencimento < hoje;
    });
  },
};
