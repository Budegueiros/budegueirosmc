/**
 * Serviço para operações relacionadas a documentos
 * Abstrai o acesso ao Supabase para a entidade de documentos
 */
import { supabase } from '../lib/supabase';
import { Documento, DocumentoComAutor, DocumentoAcesso, DocumentoTipoDestinatario } from '../types/database.types';
import { handleSupabaseError } from '../utils/errorHandler';

export const documentoService = {
  /**
   * Busca todos os documentos com informações do autor
   */
  async buscarTodos(): Promise<DocumentoComAutor[]> {
    const { data, error } = await supabase
      .from('documentos')
      .select(`
        *,
        autor:membros!documentos_membro_id_autor_fkey (
          nome_guerra,
          foto_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return (data || []).map((d) => ({
      ...d,
      autor: d.autor || { nome_guerra: 'Desconhecido', foto_url: null },
      ja_acessado: false, // Será preenchido pelo método buscarComStatusAcesso
    })) as DocumentoComAutor[];
  },

  /**
   * Busca documentos com status de acesso para um membro específico
   * Filtra documentos baseado no tipo de destinatário
   */
  async buscarComStatusAcesso(
    membroId: string,
    membroNomeGuerra?: string,
    membroCargos?: string[]
  ): Promise<DocumentoComAutor[]> {
    const [documentosData, acessosData] = await Promise.all([
      this.buscarTodos(),
      supabase
        .from('documentos_acesso')
        .select('documento_id')
        .eq('membro_id', membroId),
    ]);

    if (acessosData.error) {
      throw handleSupabaseError(acessosData.error);
    }

    const idsAcessados = new Set(acessosData.data?.map((a) => a.documento_id) || []);

    // Filtrar documentos baseado no tipo de destinatário
    const documentosFiltrados = documentosData.filter((doc) => {
      if (doc.tipo_destinatario === 'geral') return true;
      
      if (doc.tipo_destinatario === 'cargo') {
        // Verificar se o membro tem o cargo especificado
        if (!membroCargos || !doc.valor_destinatario) return false;
        return membroCargos.includes(doc.valor_destinatario);
      }
      
      if (doc.tipo_destinatario === 'membro') {
        // Verificar se é para este membro específico (comparar nome de guerra)
        if (!membroNomeGuerra || !doc.valor_destinatario) return false;
        return doc.valor_destinatario.toUpperCase() === membroNomeGuerra.toUpperCase();
      }
      
      return false;
    });

    return documentosFiltrados.map((doc) => ({
      ...doc,
      ja_acessado: idsAcessados.has(doc.id),
    }));
  },

  /**
   * Marca um documento como acessado para um membro
   */
  async marcarComoAcessado(documentoId: string, membroId: string): Promise<void> {
    const { error } = await supabase
      .from('documentos_acesso')
      .insert({
        documento_id: documentoId,
        membro_id: membroId,
      });

    if (error) {
      // Ignorar erro de duplicata (já foi marcado como acessado)
      if (error.code !== '23505') {
        throw handleSupabaseError(error);
      }
    }
  },

  /**
   * Busca um documento por ID
   */
  async buscarPorId(id: string): Promise<DocumentoComAutor | null> {
    const { data, error } = await supabase
      .from('documentos')
      .select(`
        *,
        autor:membros!documentos_membro_id_autor_fkey (
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
      ja_acessado: false,
    } as DocumentoComAutor;
  },

  /**
   * Cria um novo documento
   */
  async criar(documento: {
    titulo: string;
    descricao?: string | null;
    arquivo_url: string;
    nome_arquivo: string;
    tipo_arquivo?: string | null;
    tamanho_bytes?: number | null;
    tipo_destinatario: DocumentoTipoDestinatario;
    valor_destinatario?: string | null;
    membro_id_autor: string;
  }): Promise<Documento> {
    const { data, error } = await supabase
      .from('documentos')
      .insert([documento])
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao criar documento: nenhum dado retornado');
    }

    return data as Documento;
  },

  /**
   * Atualiza um documento existente
   */
  async atualizar(id: string, dados: {
    titulo?: string;
    descricao?: string | null;
    tipo_destinatario?: DocumentoTipoDestinatario;
    valor_destinatario?: string | null;
  }): Promise<Documento> {
    const { data, error } = await supabase
      .from('documentos')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!data) {
      throw new Error('Erro ao atualizar documento: nenhum dado retornado');
    }

    return data as Documento;
  },

  /**
   * Deleta um documento
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }
  },

  /**
   * Busca documentos com estatísticas de acesso (para administração)
   * Otimizado para evitar queries N+1
   */
  async buscarComEstatisticas(): Promise<Array<DocumentoComAutor & {
    total_destinatarios: number;
    total_acessos: number;
    percentual_acesso: number;
  }>> {
    const documentos = await this.buscarTodos();

    if (documentos.length === 0) {
      return [];
    }

    // Buscar todos os acessos em batch
    const documentoIds = documentos.map((d) => d.id);
    const { data: todosAcessos, error: acessosError } = await supabase
      .from('documentos_acesso')
      .select('documento_id, membro_id, acessado_em')
      .in('documento_id', documentoIds);

    if (acessosError) {
      throw handleSupabaseError(acessosError);
    }

    // Organizar acessos por documento
    const acessosPorDocumento = (todosAcessos || []).reduce((acc, acesso) => {
      if (!acc[acesso.documento_id]) {
        acc[acesso.documento_id] = [];
      }
      acc[acesso.documento_id].push(acesso);
      return acc;
    }, {} as Record<string, typeof todosAcessos>);

    // Buscar todos os membros ativos com seus cargos em batch
    const { data: todosMembroAtivos } = await supabase
      .from('membros')
      .select(`
        id, nome_guerra, foto_url,
        membro_cargos (
          ativo,
          cargos (
            nome
          )
        )
      `)
      .eq('ativo', true);

    const membrosAtivos = todosMembroAtivos || [];
    const totalMembrosAtivos = membrosAtivos.length;

    // Pré-calcular contagem de membros ativos por cargo
    const membrosPorCargo = new Map<string, number>();
    for (const membro of membrosAtivos) {
      const cargosAtivos = (membro.membro_cargos || [])
        .filter((mc: { ativo: boolean; cargos: { nome: string } | null }) => mc.ativo && mc.cargos)
        .map((mc: { ativo: boolean; cargos: { nome: string } | null }) => mc.cargos!.nome);
      for (const cargo of cargosAtivos) {
        membrosPorCargo.set(cargo, (membrosPorCargo.get(cargo) ?? 0) + 1);
      }
    }

    // Calcular estatísticas para cada documento
    return documentos.map((documento) => {
      const acessos = acessosPorDocumento[documento.id] || [];
      const totalAcessos = acessos.length;

      // Calcular destinatários baseado no tipo de destinatário
      let totalDestinatarios: number;
      if (documento.tipo_destinatario === 'geral') {
        totalDestinatarios = totalMembrosAtivos;
      } else if (documento.tipo_destinatario === 'cargo' && documento.valor_destinatario) {
        totalDestinatarios = membrosPorCargo.get(documento.valor_destinatario) ?? 0;
      } else if (documento.tipo_destinatario === 'membro') {
        totalDestinatarios = 1;
      } else {
        totalDestinatarios = totalMembrosAtivos;
      }

      const percentualAcesso = totalDestinatarios > 0
        ? Math.round((totalAcessos / totalDestinatarios) * 100)
        : 0;

      return {
        ...documento,
        total_destinatarios: totalDestinatarios,
        total_acessos: totalAcessos,
        percentual_acesso: percentualAcesso,
      };
    });
  },
};
