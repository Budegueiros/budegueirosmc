import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Plus, Loader2, Download, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useAdmin } from '../hooks/useAdmin';
import CreateComunicadoForm from '../components/CreateComunicadoForm';
import ComunicadosTable from '../components/comunicados/ComunicadosTable';
import ComunicadosMetricsCards from '../components/comunicados/ComunicadosMetricsCards';
import Pagination from '../components/mensalidades/Pagination';
import { ComunicadoComAutor, ComunicadoPrioridade, ComunicadoTipoDestinatario } from '../types/database.types';
import { exportarComunicadosParaCSV, exportarComunicadosParaPDF } from '../utils/exportHelpers';

interface ComunicadoComEstatisticas extends ComunicadoComAutor {
  total_destinatarios: number;
  total_lidos: number;
  percentual_leitura: number;
  leituras: Array<{
    membro: {
      nome_guerra: string;
      foto_url: string | null;
    };
    lido_em: string;
  }>;
  nao_leu: Array<{
    nome_guerra: string;
    foto_url: string | null;
  }>;
}

export default function ManageComunicados() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [comunicados, setComunicados] = useState<ComunicadoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filters, setFilters] = useState({
    search: '',
    prioridade: 'todos',
    tipo_destinatario: 'todos'
  });
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'normal' as ComunicadoPrioridade,
    tipo_destinatario: 'geral' as ComunicadoTipoDestinatario,
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

      // Buscar todos os comunicados com autor
      const { data: comunicadosData, error: comunicadosError } = await supabase
        .from('comunicados')
        .select(`
          *,
          autor:membros!comunicados_membro_id_autor_fkey (
            nome_guerra,
            foto_url
          )
        `)
        .order('created_at', { ascending: false });

      if (comunicadosError) throw comunicadosError;

      // Para cada comunicado, buscar estatísticas de leitura
      const comunicadosComStats = await Promise.all(
        (comunicadosData || []).map(async (comunicado: any) => {
          const { data: todasLeituras } = await supabase
            .from('comunicados_leitura')
            .select('membro_id, lido_em')
            .eq('comunicado_id', comunicado.id);

          const totalLeituras = todasLeituras?.length || 0;

          const membrosIds = [...new Set(todasLeituras?.map((l: any) => l.membro_id) || [])];
          let membrosData: any[] = [];
          
          if (membrosIds.length > 0) {
            const { data: membros } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url')
              .in('id', membrosIds);
            membrosData = membros || [];
          }

          const membrosMap = new Map(membrosData.map((m: any) => [m.id, m]));

          const leiturasComMembros = (todasLeituras || []).map((leitura: any) => {
            const membro = membrosMap.get(leitura.membro_id);
            return {
              lido_em: leitura.lido_em,
              membro: membro || { nome_guerra: 'Membro removido', foto_url: null }
            };
          });

          // Calcular total de destinatários
          let totalDestinatarios = 0;
          let destinatariosData: any[] = [];
          
          if (comunicado.tipo_destinatario === 'geral') {
            const { data: membrosGeral, count } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url', { count: 'exact' })
              .eq('ativo', true);
            totalDestinatarios = count || 0;
            destinatariosData = membrosGeral || [];
          } else if (comunicado.tipo_destinatario === 'cargo') {
            const { data: cargoData } = await supabase
              .from('cargos')
              .select('id')
              .eq('nome', comunicado.valor_destinatario)
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
          } else if (comunicado.tipo_destinatario === 'membro') {
            const { data: membroEspecifico } = await supabase
              .from('membros')
              .select('id, nome_guerra, foto_url')
              .eq('nome_guerra', comunicado.valor_destinatario)
              .eq('ativo', true)
              .single();
            totalDestinatarios = 1;
            if (membroEspecifico) {
              destinatariosData = [membroEspecifico];
            }
          }

          // Identificar quem não leu
          const idsQueLeram = new Set((todasLeituras || []).map((l: any) => l.membro_id));
          const naoLeu = destinatariosData.filter((m: any) => !idsQueLeram.has(m.id));

          const percentualLeitura = totalDestinatarios > 0 
            ? Math.round((totalLeituras / totalDestinatarios) * 100) 
            : 0;

          return {
            ...comunicado,
            autor: comunicado.autor || { nome_guerra: 'Desconhecido', foto_url: null },
            total_destinatarios: totalDestinatarios,
            total_lidos: totalLeituras,
            percentual_leitura: percentualLeitura,
            leituras: leiturasComMembros,
            nao_leu: naoLeu.map((m: any) => ({
              nome_guerra: m.nome_guerra,
              foto_url: m.foto_url
            }))
          };
        })
      );

      setComunicados(comunicadosComStats);
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
      toastError('Erro ao carregar comunicados.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comunicados
  const filteredComunicados = useMemo(() => {
    return comunicados.filter(c => {
      const matchSearch = 
        c.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.conteudo.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchPrioridade = filters.prioridade === 'todos' || c.prioridade === filters.prioridade;
      const matchTipo = filters.tipo_destinatario === 'todos' || c.tipo_destinatario === filters.tipo_destinatario;
      
      return matchSearch && matchPrioridade && matchTipo;
    });
  }, [comunicados, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredComunicados.length / itemsPerPage);
  const paginatedComunicados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredComunicados.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredComunicados, currentPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalLidos = comunicados.reduce((acc, c) => acc + c.total_lidos, 0);
    const totalDestinatarios = comunicados.reduce((acc, c) => acc + c.total_destinatarios, 0);
    const totalPendentes = totalDestinatarios - totalLidos;
    const taxaEngajamento = totalDestinatarios > 0 
      ? (totalLidos / totalDestinatarios) * 100 
      : 0;

    return {
      total: comunicados.length,
      lidos: totalLidos,
      pendentes: totalPendentes,
      taxaEngajamento
    };
  }, [comunicados]);

  const handleEditar = (comunicadoId: string) => {
    const comunicado = comunicados.find(c => c.id === comunicadoId);
    if (!comunicado) return;
    
    setEditando(comunicadoId);
    setFormData({
      titulo: comunicado.titulo,
      conteudo: comunicado.conteudo,
      prioridade: comunicado.prioridade,
      tipo_destinatario: comunicado.tipo_destinatario,
      valor_destinatario: comunicado.valor_destinatario || ''
    });
  };

  const handleSalvarEdicao = async (comunicadoId: string) => {
    try {
      const { error } = await supabase
        .from('comunicados')
        .update({
          titulo: formData.titulo,
          conteudo: formData.conteudo,
          prioridade: formData.prioridade,
          tipo_destinatario: formData.tipo_destinatario,
          valor_destinatario: formData.tipo_destinatario === 'geral' ? null : formData.valor_destinatario
        })
        .eq('id', comunicadoId);

      if (error) throw error;

      toastSuccess('Comunicado atualizado com sucesso!');
      setEditando(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar comunicado:', error);
      toastError('Erro ao atualizar comunicado.');
    }
  };

  const handleDeletar = async (comunicadoId: string) => {
    try {
      const { error } = await supabase
        .from('comunicados')
        .delete()
        .eq('id', comunicadoId);

      if (error) throw error;

      toastSuccess('Comunicado deletado com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao deletar comunicado:', error);
      toastError('Erro ao deletar comunicado.');
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
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Gerenciar Comunicados
            </h1>
            <p className="text-gray-400">
              Controle de comunicados e engajamento dos sócios
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Novo Comunicado
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => exportarComunicadosParaCSV(filteredComunicados, 'comunicados')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => exportarComunicadosParaPDF(filteredComunicados, 'Relatório de Comunicados')}
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
      <ComunicadosMetricsCards metrics={metrics} />

      {/* Formulário de Criação */}
      {isCreating && membroId && (
        <div className="mb-6">
          <CreateComunicadoForm
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
                  placeholder="Buscar por título ou conteúdo..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition"
                />
              </div>

              <select
                value={filters.prioridade}
                onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[150px]"
              >
                <option value="todos">Todas as Prioridades</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>

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
          <ComunicadosTable
            comunicados={paginatedComunicados}
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
              totalItems={filteredComunicados.length}
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
            <h3 className="text-white text-xl font-bold mb-4">Editar Comunicado</h3>
            
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
                <label className="block text-gray-400 text-xs uppercase mb-1">Conteúdo</label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600 min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as ComunicadoPrioridade })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Tipo Destinatário</label>
                  <select
                    value={formData.tipo_destinatario}
                    onChange={(e) => setFormData({ ...formData, tipo_destinatario: e.target.value as ComunicadoTipoDestinatario })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  >
                    <option value="geral">Geral</option>
                    <option value="cargo">Por Cargo</option>
                    <option value="membro">Integrante Específico</option>
                  </select>
                </div>
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
