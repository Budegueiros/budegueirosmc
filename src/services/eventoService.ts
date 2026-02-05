/**
 * Serviço para operações relacionadas a eventos
 * Abstrai o acesso ao Supabase para a entidade de eventos
 */
import { supabase } from '../lib/supabase';
import { Evento } from '../types/database.types';

export const eventoService = {
  /**
   * Busca o próximo evento ativo
   */
  async buscarProximoEvento(): Promise<Evento | null> {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('status', 'Ativo')
      .gte('data_evento', new Date().toISOString().split('T')[0])
      .order('data_evento', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar próximo evento: ${error.message}`);
    }

    return data as Evento | null;
  },

  /**
   * Conta o número de confirmações de presença para um evento
   */
  async contarConfirmados(eventoId: string): Promise<{ confirmados: number; budegueiras: number; visitantes: number }> {
    const { data, error } = await supabase
      .from('confirmacoes_presenca')
      .select('vai_com_budegueira, quantidade_visitantes')
      .eq('evento_id', eventoId)
      .eq('status', 'Confirmado');

    if (error) {
      throw new Error(`Erro ao contar confirmados: ${error.message}`);
    }

    const confirmados = data?.length || 0;
    const budegueiras = (data || []).filter((c) => c.vai_com_budegueira).length;
    const visitantes = (data || []).reduce((acc, c) => acc + (c.quantidade_visitantes || 0), 0);

    return { confirmados, budegueiras, visitantes };
  },

  /**
   * Verifica se um membro já confirmou presença em um evento
   */
  async verificarConfirmacao(membroId: string, eventoId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('confirmacoes_presenca')
      .select('id')
      .eq('evento_id', eventoId)
      .eq('membro_id', membroId)
      .eq('status', 'Confirmado')
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao verificar confirmação: ${error.message}`);
    }

    return data?.id || null;
  },

  /**
   * Confirma ou cancela presença de um membro em um evento
   */
  async toggleConfirmacaoPresenca(
    membroId: string,
    eventoId: string,
    confirmacaoId: string | null,
    detalhes?: {
      vaiComBudegueira?: boolean;
      quantidadeVisitantes?: number;
    }
  ): Promise<{ id: string; action: 'created' | 'deleted'; detalhes?: { vaiComBudegueira: boolean; quantidadeVisitantes: number } }> {
    if (confirmacaoId) {
      // Cancelar confirmação existente
      const { data, error } = await supabase
        .from('confirmacoes_presenca')
        .delete()
        .eq('id', confirmacaoId)
        .select('vai_com_budegueira, quantidade_visitantes')
        .single();

      if (error) {
        throw new Error(`Erro ao cancelar confirmação: ${error.message}`);
      }

      return {
        id: confirmacaoId,
        action: 'deleted',
        detalhes: {
          vaiComBudegueira: data?.vai_com_budegueira ?? false,
          quantidadeVisitantes: data?.quantidade_visitantes ?? 0,
        },
      };
    } else {
      // Criar nova confirmação
      const { data, error } = await supabase
        .from('confirmacoes_presenca')
        .insert({
          evento_id: eventoId,
          membro_id: membroId,
          status: 'Confirmado',
          data_confirmacao: new Date().toISOString(),
          vai_com_budegueira: detalhes?.vaiComBudegueira ?? false,
          quantidade_visitantes: detalhes?.quantidadeVisitantes ?? 0,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Erro ao confirmar presença: ${error.message}`);
      }

      return {
        id: data.id,
        action: 'created',
        detalhes: {
          vaiComBudegueira: detalhes?.vaiComBudegueira ?? false,
          quantidadeVisitantes: detalhes?.quantidadeVisitantes ?? 0,
        },
      };
    }
  },

  /**
   * Calcula o total de KM rodados por um membro no ano atual
   * Otimizado usando join ao invés de queries N+1
   */
  async calcularKmAnual(membroId: string): Promise<number> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = new Date(anoAtual, 0, 1).toISOString().split('T')[0];
    const fimAno = new Date(anoAtual, 11, 31).toISOString().split('T')[0];

    // Buscar participações com join no evento (evita N+1)
    const { data, error } = await supabase
      .from('participacoes_eventos')
      .select(`
        evento:eventos!inner (
          distancia_km,
          data_evento
        )
      `)
      .eq('membro_id', membroId)
      .gte('evento.data_evento', inicioAno)
      .lte('evento.data_evento', fimAno);

    if (error) {
      throw new Error(`Erro ao calcular KM anual: ${error.message}`);
    }

    // Somar as distâncias
    const totalKm = (data || []).reduce((acc, p) => {
      const distancia = (p.evento as { distancia_km: number | null })?.distancia_km || 0;
      return acc + (typeof distancia === 'number' && !isNaN(distancia) ? distancia : 0);
    }, 0);

    // Arredondar para 2 casas decimais
    return Math.round(totalKm * 100) / 100;
  },

  /**
   * Busca todos os eventos
   */
  async buscarTodos(): Promise<Evento[]> {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar eventos: ${error.message}`);
    }

    return (data || []) as Evento[];
  },

  /**
   * Busca um evento por ID
   */
  async buscarPorId(id: string): Promise<Evento | null> {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar evento: ${error.message}`);
    }

    return data as Evento | null;
  },

  /**
   * Cria um novo evento
   */
  async criar(evento: {
    nome: string;
    descricao?: string | null;
    data_evento: string;
    hora_saida?: string | null;
    local_saida: string;
    local_destino?: string | null;
    cidade: string;
    estado: string;
    distancia_km?: number | null;
    tipo_evento: string;
    status: string;
    vagas_limitadas: boolean;
    max_participantes?: number | null;
    foto_capa_url?: string | null;
    observacoes?: string | null;
    evento_principal: boolean;
  }): Promise<Evento> {
    const { data, error } = await supabase
      .from('eventos')
      .insert([evento])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar evento: ${error.message}`);
    }

    if (!data) {
      throw new Error('Erro ao criar evento: nenhum dado retornado');
    }

    return data as Evento;
  },

  /**
   * Atualiza um evento existente
   */
  async atualizar(id: string, dados: {
    nome?: string;
    descricao?: string | null;
    data_evento?: string;
    hora_saida?: string | null;
    local_saida?: string;
    local_destino?: string | null;
    cidade?: string;
    estado?: string;
    distancia_km?: number | null;
    tipo_evento?: string;
    status?: string;
    vagas_limitadas?: boolean;
    max_participantes?: number | null;
    foto_capa_url?: string | null;
    observacoes?: string | null;
    evento_principal?: boolean;
  }): Promise<Evento> {
    const { data, error } = await supabase
      .from('eventos')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar evento: ${error.message}`);
    }

    if (!data) {
      throw new Error('Erro ao atualizar evento: nenhum dado retornado');
    }

    return data as Evento;
  },

  /**
   * Deleta um evento
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar evento: ${error.message}`);
    }
  },

  /**
   * Atualiza o status de um evento
   */
  async atualizarStatus(id: string, status: string): Promise<Evento> {
    return this.atualizar(id, { status });
  },
};
