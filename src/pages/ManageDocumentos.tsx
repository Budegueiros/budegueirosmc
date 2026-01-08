import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Loader2, Download, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useAdmin } from '../hooks/useAdmin';
import CreateDocumentoForm from '../components/CreateDocumentoForm';
import DocumentosTable from '../components/documentos/DocumentosTable';
import DocumentosMetricsCards from '../components/documentos/DocumentosMetricsCards';
import Pagination from '../components/mensalidades/Pagination';
import { DocumentoComAutor, DocumentoTipoDestinatario } from '../types/database.types';
import { exportarDocumentosParaCSV, exportarDocumentosParaPDF } from '../utils/exportHelpers';

interface DocumentoComEstatisticas extends DocumentoComAutor {
  total_destinatarios: number;
  total_acessos: number;
  percentual_acesso: number;
  acessos: Array<{
    membro: {
      nome_guerra: string;
      foto_url: string | null;
    };
    acessado_em: string;
  }>;
  nao_acessou: Array<{
    nome_guerra: string;
    foto_url: string | null;
  }>;
}

export default function ManageDocumentos() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filters, setFilters] = useState({
    search: '',
    tipo_destinatario: 'todos'
  });
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo_destinatario: 'geral' as DocumentoTipoDestinatario,
    valor_destinatario: ''
  });

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membro
      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (membroError) throw membroError;
      if (!membroData) return;

      setMembroId(membroData.id);

      // Buscar todos os documentos com autor
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select(`
          *,
          autor:membros!documentos_membro_id_autor_fkey (
            nome_guerra,
            foto_url
          )
        `)
        .order('created_at', { ascending: false });

      if (documentosError) throw documentosError;

      // Para cada documento, buscar estatísticas de acesso
      const documentosComStats = await Promise.all(
        (documentosData || []).map(async (documento: any) => {
          const { data: todosAcessos } = await supabase
            .from('documentos_acesso')
            .select('membro_id, acessado_em')
            .eq('documento_id', documento.id);

          const totalAcessos = todosAcessos?.length || 0;

          const membrosIds = [...new Set(todosAcessos?.map((a: any) => a.membro_id) || [])];
          let membrosData: any[] = [];
          
          if (membrosIds.length > 0) {
            const { data: membros } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url')
              .in('id', membrosIds);
            membrosData = membros || [];
          }

          const membrosMap = new Map(membrosData.map((m: any) => [m.id, m]));

          const acessosComMembros = (todosAcessos || []).map((acesso: any) => {
            const membro = membrosMap.get(acesso.membro_id);
            return {
              acessado_em: acesso.acessado_em,
              membro: membro || { nome_guerra: 'Membro removido', foto_url: null }
            };
          });

          // Calcular total de destinatários
          let totalDestinatarios = 0;
          let destinatariosData: any[] = [];
          
          if (documento.tipo_destinatario === 'geral') {
            const { data: membrosGeral, count } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url', { count: 'exact' })
              .eq('ativo', true);
            totalDestinatarios = count || 0;
            destinatariosData = membrosGeral || [];
          } else if (documento.tipo_destinatario === 'cargo') {
            const { data: cargoData } = await supabase
              .from('cargos')
              .select('id')
              .eq('nome', documento.valor_destinatario)
              .eq('ativo', true)
              .single();

            if (cargoData) {
              const { data: membrosCargo, count } = await supabase
                .from('membro_cargos')
                .select(`
                  membro_id,
                  membros (
                    id,
                    nome_guerra,
                    foto_url
                  )
                `, { count: 'exact' })
                .eq('ativo', true)
                .eq('cargo_id', cargoData.id);
              
              totalDestinatarios = count || 0;
              destinatariosData = (membrosCargo || [])
                .map((mc: any) => mc.membros)
                .filter((m: any) => m && m.id);
            }
          } else if (documento.tipo_destinatario === 'membro') {
            const { data: membroEspecifico } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url')
              .eq('nome_guerra', documento.valor_destinatario)
              .eq('ativo', true)
              .single();
            totalDestinatarios = 1;
            if (membroEspecifico) {
              destinatariosData = [membroEspecifico];
            }
          }

          // Identificar quem não acessou
          const idsQueAcessaram = new Set((todosAcessos || []).map((a: any) => a.membro_id));
          const naoAcessou = destinatariosData.filter((m: any) => !idsQueAcessaram.has(m.id));

          const percentualAcesso = totalDestinatarios > 0 
            ? Math.round((totalAcessos / totalDestinatarios) * 100) 
            : 0;

          return {
            ...documento,
            autor: documento.autor || { nome_guerra: 'Desconhecido', foto_url: null },
            total_destinatarios: totalDestinatarios,
            total_acessos: totalAcessos,
            percentual_acesso: percentualAcesso,
            acessos: acessosComMembros,
            nao_acessou: naoAcessou.map((m: any) => ({
              nome_guerra: m.nome_guerra,
              foto_url: m.foto_url
            }))
          };
        })
      );

      setDocumentos(documentosComStats);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toastError('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar documentos
  const filteredDocumentos = useMemo(() => {
    return documentos.filter(d => {
      const matchSearch = 
        d.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        (d.descricao && d.descricao.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchTipo = filters.tipo_destinatario === 'todos' || d.tipo_destinatario === filters.tipo_destinatario;
      
      return matchSearch && matchTipo;
    });
  }, [documentos, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredDocumentos.length / itemsPerPage);
  const paginatedDocumentos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocumentos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocumentos, currentPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalAcessados = documentos.reduce((acc, d) => acc + d.total_acessos, 0);
    const totalDestinatarios = documentos.reduce((acc, d) => acc + d.total_destinatarios, 0);
    const totalPendentes = totalDestinatarios - totalAcessados;
    const taxaEngajamento = totalDestinatarios > 0 
      ? (totalAcessados / totalDestinatarios) * 100 
      : 0;

    return {
      total: documentos.length,
      acessados: totalAcessados,
      pendentes: totalPendentes,
      taxaEngajamento
    };
  }, [documentos]);

  const handleEditar = (documentoId: string) => {
    const documento = documentos.find(d => d.id === documentoId);
    if (!documento) return;
    
    setEditando(documentoId);
    setFormData({
      titulo: documento.titulo,
      descricao: documento.descricao || '',
      tipo_destinatario: documento.tipo_destinatario,
      valor_destinatario: documento.valor_destinatario || ''
    });
  };

  const handleSalvarEdicao = async (documentoId: string) => {
    try {
      const { error } = await supabase
        .from('documentos')
        .update({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          tipo_destinatario: formData.tipo_destinatario,
          valor_destinatario: formData.tipo_destinatario === 'geral' ? null : formData.valor_destinatario
        })
        .eq('id', documentoId);

      if (error) throw error;

      toastSuccess('Documento atualizado com sucesso!');
      setEditando(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      toastError('Erro ao atualizar documento.');
    }
  };

  const handleDeletar = async (documentoId: string) => {
    try {
      // Buscar o documento para pegar a URL do arquivo
      const { data: documento } = await supabase
        .from('documentos')
        .select('arquivo_url')
        .eq('id', documentoId)
        .single();

      // Deletar do banco
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;

      // Tentar deletar o arquivo do storage (opcional)
      if (documento?.arquivo_url) {
        try {
          const urlParts = documento.arquivo_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage
              .from('documentos')
              .remove([fileName]);
          }
        } catch (storageError) {
          console.warn('Erro ao deletar arquivo do storage:', storageError);
        }
      }

      toastSuccess('Documento deletado com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toastError('Erro ao deletar documento.');
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Painel Administrativo
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Gerenciar Documentos
            </h1>
            <p className="text-gray-400">
              Controle de documentos e acesso dos sócios
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Novo Documento
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => exportarDocumentosParaCSV(filteredDocumentos, 'documentos')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => exportarDocumentosParaPDF(filteredDocumentos, 'Relatório de Documentos')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <DocumentosMetricsCards metrics={metrics} />

      {/* Formulário de Criação */}
      {isCreating && membroId && (
        <div className="mb-6">
          <CreateDocumentoForm
            membroId={membroId}
            onSuccess={() => {
              setIsCreating(false);
              carregarDados();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {/* Filtros */}
      {!isCreating && (
        <>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="search"
                  placeholder="Buscar por título ou descrição..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition"
                />
              </div>

              <select
                value={filters.tipo_destinatario}
                onChange={(e) => setFilters({ ...filters, tipo_destinatario: e.target.value })}
                className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[150px]"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="geral">Geral</option>
                <option value="cargo">Por Cargo</option>
                <option value="membro">Privado</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <DocumentosTable
            documentos={paginatedDocumentos}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={handleEditar}
            onDelete={handleDeletar}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDocumentos.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Modal de Edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-xl font-bold mb-4">Editar Documento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Tipo Destinatário</label>
                <select
                  value={formData.tipo_destinatario}
                  onChange={(e) => setFormData({ ...formData, tipo_destinatario: e.target.value as DocumentoTipoDestinatario })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                >
                  <option value="geral">Geral</option>
                  <option value="cargo">Por Cargo</option>
                  <option value="membro">Integrante Específico</option>
                </select>
              </div>

              {formData.tipo_destinatario !== 'geral' && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">
                    {formData.tipo_destinatario === 'cargo' ? 'Nome do Cargo' : 'Nome de Guerra do Membro'}
                  </label>
                  <input
                    type="text"
                    value={formData.valor_destinatario}
                    onChange={(e) => setFormData({ ...formData, valor_destinatario: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSalvarEdicao(editando)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition flex items-center gap-2"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
