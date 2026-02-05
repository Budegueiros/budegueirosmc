/**
 * Serviço para operações relacionadas a motos
 * Abstrai o acesso ao Supabase para a entidade de motos
 */
import { supabase } from '../lib/supabase';

/**
 * Interface para dados de uma moto
 */
export interface MotoData {
  id: string;
  membro_id: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  ativa: boolean;
  created_at: string;
}

export const motoService = {
  /**
   * Busca todas as motos ativas de um membro
   */
  async buscarPorMembroId(membroId: string): Promise<MotoData[]> {
    const { data, error } = await supabase
      .from('motos')
      .select('*')
      .eq('membro_id', membroId)
      .eq('ativa', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar motos: ${error.message}`);
    }

    return (data || []) as MotoData[];
  },
};
