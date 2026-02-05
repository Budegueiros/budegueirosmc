/**
 * Serviço para operações relacionadas a enquetes e votações
 * Abstrai o acesso ao Supabase para a entidade de enquetes
 */
import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../utils/errorHandler';

/**
 * Interface para uma enquete
 */
export interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
}

/**
 * Interface para uma opção de enquete
 */
export interface OpcaoEnquete {
  id: string;
  texto: string;
  ordem: number;
  votos: number;
  percentual: number;
}

/**
 * Interface para um voto
 */
export interface Voto {
  id: string;
  enquete_id: string;
  membro_id: string;
  opcao_id: string | null;
  texto_livre: string | null;
  created_at: string;
}

/**
 * Interface para resultado de uma enquete com opções e estatísticas
 */
export interface EnqueteComOpcoes extends Enquete {
  opcoes: OpcaoEnquete[];
  meuVoto: Voto | null;
  totalVotos: number;
}

export const pollService = {
  /**
   * Busca todas as enquetes por status
   */
  async buscarPorStatus(status: 'aberta' | 'encerrada'): Promise<Enquete[]> {
    const { data, error } = await supabase
      .from('enquetes')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []) as Enquete[];
  },

  /**
   * Busca uma enquete com suas opções e estatísticas de votos
   * Otimizado para evitar queries N+1 usando joins
   */
  async buscarComOpcoes(enqueteId: string, membroId: string): Promise<EnqueteComOpcoes | null> {
    const { data: enqueteData, error: enqueteError } = await supabase
      .from('enquetes')
      .select('*')
      .eq('id', enqueteId)
      .single();

    if (enqueteError) {
      throw handleSupabaseError(enqueteError);
    }

    if (!enqueteData) return null;

    const enquete = enqueteData as Enquete;

    // Buscar opções e votos em paralelo
    const [opcoesResult, votosResult, meuVotoResult] = await Promise.all([
      enquete.tipo === 'multipla_escolha'
        ? supabase
            .from('enquete_opcoes')
            .select('*')
            .eq('enquete_id', enqueteId)
            .order('ordem')
        : Promise.resolve({ data: [], error: null }),
      enquete.tipo === 'multipla_escolha'
        ? supabase
            .from('votos')
            .select('opcao_id')
            .eq('enquete_id', enqueteId)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('votos')
        .select('*')
        .eq('enquete_id', enqueteId)
        .eq('membro_id', membroId)
        .maybeSingle(),
    ]);

    if (opcoesResult.error) {
      throw handleSupabaseError(opcoesResult.error);
    }

    if (votosResult.error) {
      throw handleSupabaseError(votosResult.error);
    }

    if (meuVotoResult.error) {
      throw handleSupabaseError(meuVotoResult.error);
    }

    const totalVotos = votosResult.data?.length || 0;
    const votosPorOpcao = (votosResult.data || []).reduce((acc, v) => {
      if (v.opcao_id) {
        acc[v.opcao_id] = (acc[v.opcao_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const opcoes: OpcaoEnquete[] = (opcoesResult.data || []).map((op) => ({
      id: op.id,
      texto: op.texto,
      ordem: op.ordem,
      votos: votosPorOpcao[op.id] || 0,
      percentual: totalVotos > 0 ? ((votosPorOpcao[op.id] || 0) / totalVotos) * 100 : 0,
    }));

    return {
      ...enquete,
      opcoes,
      meuVoto: meuVotoResult.data as Voto | null,
      totalVotos,
    };
  },

  /**
   * Busca todas as enquetes com opções e votos do membro
   * Otimizado para evitar queries N+1
   */
  async buscarTodasComOpcoes(membroId: string, status: 'aberta' | 'encerrada'): Promise<EnqueteComOpcoes[]> {
    const enquetes = await this.buscarPorStatus(status);

    // Buscar todas as opções e votos em batch
    const enqueteIds = enquetes.map((e) => e.id);
    
    if (enqueteIds.length === 0) {
      return [];
    }

    const [opcoesResult, votosResult, meusVotosResult] = await Promise.all([
      supabase
        .from('enquete_opcoes')
        .select('*')
        .in('enquete_id', enqueteIds)
        .order('enquete_id')
        .order('ordem'),
      supabase
        .from('votos')
        .select('opcao_id, enquete_id')
        .in('enquete_id', enqueteIds),
      supabase
        .from('votos')
        .select('*')
        .in('enquete_id', enqueteIds)
        .eq('membro_id', membroId),
    ]);

    if (opcoesResult.error) {
      throw handleSupabaseError(opcoesResult.error);
    }

    if (votosResult.error) {
      throw handleSupabaseError(votosResult.error);
    }

    if (meusVotosResult.error) {
      throw handleSupabaseError(meusVotosResult.error);
    }

    // Organizar dados por enquete
    const opcoesPorEnquete = (opcoesResult.data || []).reduce((acc, op) => {
      if (!acc[op.enquete_id]) {
        acc[op.enquete_id] = [];
      }
      acc[op.enquete_id].push(op);
      return acc;
    }, {} as Record<string, typeof opcoesResult.data>);

    const votosPorEnquete = (votosResult.data || []).reduce((acc, v) => {
      if (!acc[v.enquete_id]) {
        acc[v.enquete_id] = [];
      }
      acc[v.enquete_id].push(v);
      return acc;
    }, {} as Record<string, typeof votosResult.data>);

    const meusVotosPorEnquete = (meusVotosResult.data || []).reduce((acc, v) => {
      acc[v.enquete_id] = v;
      return acc;
    }, {} as Record<string, Voto>);

    // Construir resultado
    return enquetes.map((enquete) => {
      const opcoesData = opcoesPorEnquete[enquete.id] || [];
      const votosData = votosPorEnquete[enquete.id] || [];
      const meuVoto = meusVotosPorEnquete[enquete.id] || null;

      const totalVotos = votosData.length;
      const votosPorOpcao = votosData.reduce((acc, v) => {
        if (v.opcao_id) {
          acc[v.opcao_id] = (acc[v.opcao_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const opcoes: OpcaoEnquete[] = opcoesData
        .sort((a, b) => a.ordem - b.ordem)
        .map((op) => ({
          id: op.id,
          texto: op.texto,
          ordem: op.ordem,
          votos: votosPorOpcao[op.id] || 0,
          percentual: totalVotos > 0 ? ((votosPorOpcao[op.id] || 0) / totalVotos) * 100 : 0,
        }));

      return {
        ...enquete,
        opcoes,
        meuVoto,
        totalVotos,
      };
    });
  },

  /**
   * Registra ou atualiza um voto
   */
  async votar(
    enqueteId: string,
    membroId: string,
    tipo: 'multipla_escolha' | 'texto_livre',
    opcaoId?: string | null,
    textoLivre?: string | null
  ): Promise<Voto> {
    // Verificar se já existe voto
    const { data: votoExistente } = await supabase
      .from('votos')
      .select('*')
      .eq('enquete_id', enqueteId)
      .eq('membro_id', membroId)
      .maybeSingle();

    if (votoExistente) {
      // Atualizar voto existente
      const { data, error } = await supabase
        .from('votos')
        .update({
          opcao_id: tipo === 'multipla_escolha' ? opcaoId || null : null,
          texto_livre: tipo === 'texto_livre' ? textoLivre || null : null,
        })
        .eq('id', votoExistente.id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Erro ao atualizar voto: nenhum dado retornado');
      }

      return data as Voto;
    } else {
      // Inserir novo voto
      const { data, error } = await supabase
        .from('votos')
        .insert({
          enquete_id: enqueteId,
          membro_id: membroId,
          opcao_id: tipo === 'multipla_escolha' ? opcaoId || null : null,
          texto_livre: tipo === 'texto_livre' ? textoLivre || null : null,
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Erro ao criar voto: nenhum dado retornado');
      }

      return data as Voto;
    }
  },

  /**
   * Busca enquetes com estatísticas de votos (para administração)
   * Otimizado para evitar queries N+1
   */
  async buscarComEstatisticas(status: 'aberta' | 'encerrada'): Promise<Array<Enquete & {
    total_votos: number;
  }>> {
    const enquetes = await this.buscarPorStatus(status);

    if (enquetes.length === 0) {
      return [];
    }

    // Buscar todas as contagens de votos em batch
    const enqueteIds = enquetes.map((e) => e.id);
    const { data: votosData, error: votosError } = await supabase
      .from('votos')
      .select('enquete_id')
      .in('enquete_id', enqueteIds);

    if (votosError) {
      throw handleSupabaseError(votosError);
    }

    // Contar votos por enquete
    const votosPorEnquete = (votosData || []).reduce((acc, voto) => {
      acc[voto.enquete_id] = (acc[voto.enquete_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Adicionar estatísticas a cada enquete
    return enquetes.map((enquete) => ({
      ...enquete,
      total_votos: votosPorEnquete[enquete.id] || 0,
    }));
  },

  /**
   * Atualiza o status de uma enquete
   */
  async atualizarStatus(id: string, status: 'aberta' | 'encerrada'): Promise<Enquete> {
    const { data, error } = await supabase
      .from('enquetes')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao atualizar status da enquete: nenhum dado retornado');
    }

    return data as Enquete;
  },

  /**
   * Deleta uma enquete e seus dados relacionados
   */
  async deletar(id: string): Promise<void> {
    // Deletar votos primeiro
    const { error: votosError } = await supabase
      .from('votos')
      .delete()
      .eq('enquete_id', id);

    if (votosError) {
      throw handleSupabaseError(votosError);
    }

    // Deletar opções
    const { error: opcoesError } = await supabase
      .from('enquete_opcoes')
      .delete()
      .eq('enquete_id', id);

    if (opcoesError) {
      throw handleSupabaseError(opcoesError);
    }

    // Deletar enquete
    const { error: enqueteError } = await supabase
      .from('enquetes')
      .delete()
      .eq('id', id);

    if (enqueteError) {
      throw handleSupabaseError(enqueteError);
    }
  },
};
