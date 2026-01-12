/**
 * Serviço para operações relacionadas a comunicados
 * Abstrai o acesso ao Supabase para a entidade de comunicados
 */
import { supabase } from '../lib/supabase';
import { Comunicado, ComunicadoComAutor, ComunicadoLeitura } from '../types/database.types';
import { handleSupabaseError } from '../utils/errorHandler';

export const comunicadoService = {
  /**
   * Busca todos os comunicados com informações do autor
   */
  async buscarTodos(): Promise<ComunicadoComAutor[]> {
    const { data, error } = await supabase
      .from('comunicados')
      .select(`
        *,
        autor:membros!comunicados_membro_id_autor_fkey (
          nome_guerra,
          foto_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []).map((c) => ({
      ...c,
      autor: c.autor || { nome_guerra: 'Desconhecido', foto_url: null },
    })) as ComunicadoComAutor[];
  },

  /**
   * Busca comunicados com status de leitura para um membro específico
   */
  async buscarComStatusLeitura(membroId: string): Promise<ComunicadoComAutor[]> {
    const [comunicadosData, leiturasData] = await Promise.all([
      this.buscarTodos(),
      supabase
        .from('comunicados_leitura')
        .select('comunicado_id')
        .eq('membro_id', membroId),
    ]);

    if (leiturasData.error) {
      throw handleSupabaseError(leiturasData.error);
    }

    const idsLidos = new Set(leiturasData.data?.map((l) => l.comunicado_id) || []);

    return comunicadosData.map((c) => ({
      ...c,
      ja_lido: idsLidos.has(c.id),
    }));
  },

  /**
   * Marca um comunicado como lido para um membro
   */
  async marcarComoLido(comunicadoId: string, membroId: string): Promise<void> {
    const { error } = await supabase
      .from('comunicados_leitura')
      .insert({
        comunicado_id: comunicadoId,
        membro_id: membroId,
      });

    if (error) {
      // Ignorar erro de duplicata (já foi marcado como lido)
      if (error.code !== '23505') {
        throw handleSupabaseError(error);
      }
    }
  },

  /**
   * Busca um comunicado por ID
   */
  async buscarPorId(id: string): Promise<ComunicadoComAutor | null> {
    const { data, error } = await supabase
      .from('comunicados')
      .select(`
        *,
        autor:membros!comunicados_membro_id_autor_fkey (
          nome_guerra,
          foto_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) return null;

    return {
      ...data,
      autor: data.autor || { nome_guerra: 'Desconhecido', foto_url: null },
    } as ComunicadoComAutor;
  },

  /**
   * Cria um novo comunicado
   */
  async criar(comunicado: {
    titulo: string;
    conteudo: string;
    prioridade: 'normal' | 'alta' | 'critica';
    tipo_destinatario: 'geral' | 'cargo' | 'membro';
    valor_destinatario?: string | null;
    membro_id_autor: string;
  }): Promise<Comunicado> {
    const { data, error } = await supabase
      .from('comunicados')
      .insert([comunicado])
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao criar comunicado: nenhum dado retornado');
    }

    return data as Comunicado;
  },

  /**
   * Atualiza um comunicado existente
   */
  async atualizar(id: string, dados: {
    titulo?: string;
    conteudo?: string;
    prioridade?: 'normal' | 'alta' | 'critica';
    tipo_destinatario?: 'geral' | 'cargo' | 'membro';
    valor_destinatario?: string | null;
  }): Promise<Comunicado> {
    const { data, error } = await supabase
      .from('comunicados')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao atualizar comunicado: nenhum dado retornado');
    }

    return data as Comunicado;
  },

  /**
   * Deleta um comunicado
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('comunicados')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }
  },

  /**
   * Busca comunicados com estatísticas de leitura (para administração)
   * Otimizado para evitar queries N+1
   */
  async buscarComEstatisticas(): Promise<Array<ComunicadoComAutor & {
    total_destinatarios: number;
    total_lidos: number;
    percentual_leitura: number;
  }>> {
    const comunicados = await this.buscarTodos();

    if (comunicados.length === 0) {
      return [];
    }

    // Buscar todas as leituras em batch
    const comunicadoIds = comunicados.map((c) => c.id);
    const { data: todasLeituras, error: leiturasError } = await supabase
      .from('comunicados_leitura')
      .select('comunicado_id, membro_id, lido_em')
      .in('comunicado_id', comunicadoIds);

    if (leiturasError) {
      throw handleSupabaseError(leiturasError);
    }

    // Organizar leituras por comunicado
    const leiturasPorComunicado = (todasLeituras || []).reduce((acc, leitura) => {
      if (!acc[leitura.comunicado_id]) {
        acc[leitura.comunicado_id] = [];
      }
      acc[leitura.comunicado_id].push(leitura);
      return acc;
    }, {} as Record<string, typeof todasLeituras>);

    // Buscar membros que leram em batch
    const membrosIds = [...new Set((todasLeituras || []).map((l) => l.membro_id))];
    const { data: membrosData } = membrosIds.length > 0
      ? await supabase
          .from('membros')
          .select('id, nome_guerra, foto_url')
          .in('id', membrosIds)
      : { data: [] };

    const membrosMap = new Map((membrosData || []).map((m) => [m.id, m]));

    // Calcular estatísticas para cada comunicado
    return comunicados.map((comunicado) => {
      const leituras = leiturasPorComunicado[comunicado.id] || [];
      const totalLeituras = leituras.length;

      // Calcular destinatários (simplificado - pode ser otimizado mais)
      // Por enquanto, retorna estatísticas básicas
      const totalDestinatarios = totalLeituras; // Aproximação - pode ser melhorado
      const percentualLeitura = totalDestinatarios > 0
        ? Math.round((totalLeituras / totalDestinatarios) * 100)
        : 0;

      return {
        ...comunicado,
        total_destinatarios: totalDestinatarios,
        total_lidos: totalLeituras,
        percentual_leitura: percentualLeitura,
      };
    });
  },
};
