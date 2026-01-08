import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, Plus, Loader2, Download, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import EnquetesTable from '../components/enquetes/EnquetesTable';
import EnquetesMetricsCards from '../components/enquetes/EnquetesMetricsCards';
import Pagination from '../components/mensalidades/Pagination';
import { exportarEnquetesParaCSV, exportarEnquetesParaPDF } from '../utils/exportHelpers';

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
  total_votos: number;
}

export default function ManagePolls() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [activeTab, setActiveTab] = useState<'aberta' | 'encerrada'>('aberta');
  const [showConfirmToggle, setShowConfirmToggle] = useState<string | null>(null);
  const [toggleStatus, setToggleStatus] = useState<'aberta' | 'encerrada' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarEnquetes();
    }
  }, [isAdmin, activeTab]);

  const carregarEnquetes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('enquetes')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada enquete, buscar estatísticas
      const enquetesComStats = await Promise.all(
        (data || []).map(async (enquete: Enquete) => {
          const { count: totalVotos } = await supabase
            .from('votos')
            .select('*', { count: 'exact', head: true })
            .eq('enquete_id', enquete.id);

            return {
              ...enquete,
            total_votos: totalVotos || 0
          };
        })
      );

      setEnquetes(enquetesComStats);
    } catch (error) {
      console.error('Erro ao carregar enquetes:', error);
      toastError('Erro ao carregar enquetes.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar enquetes
  const filteredEnquetes = useMemo(() => {
    return enquetes.filter(e =>
      e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.descricao && e.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [enquetes, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredEnquetes.length / itemsPerPage);
  const paginatedEnquetes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEnquetes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEnquetes, currentPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const ativas = enquetes.filter(e => e.status === 'aberta').length;
    const finalizadas = enquetes.filter(e => e.status === 'encerrada').length;
    const totalVotos = enquetes.reduce((acc, e) => acc + e.total_votos, 0);
    const taxaParticipacao = enquetes.length > 0 ? totalVotos / enquetes.length : 0;

    return {
      total: enquetes.length,
      ativas,
      finalizadas,
      taxaParticipacao
    };
  }, [enquetes]);

  const handleToggleStatus = (enqueteId: string) => {
    const enquete = enquetes.find(e => e.id === enqueteId);
    if (!enquete) return;
    
    const novoStatus = enquete.status === 'aberta' ? 'encerrada' : 'aberta';
    setShowConfirmToggle(enqueteId);
    setToggleStatus(novoStatus);
  };

  const executeToggleStatus = async () => {
    if (!showConfirmToggle || !toggleStatus) return;

    try {
      const { error } = await supabase
        .from('enquetes')
        .update({ status: toggleStatus })
        .eq('id', showConfirmToggle);

      if (error) throw error;

      setShowConfirmToggle(null);
      setToggleStatus(null);
      await carregarEnquetes();
      toastSuccess(`Enquete ${toggleStatus === 'encerrada' ? 'encerrada' : 'reaberta'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastError('Erro ao alterar status da enquete.');
      setShowConfirmToggle(null);
      setToggleStatus(null);
    }
  };

  const handleDeleteEnquete = async (enqueteId: string) => {
    try {
      // Deletar votos primeiro
      await supabase
        .from('votos')
        .delete()
        .eq('enquete_id', enqueteId);

      // Deletar opções
      await supabase
        .from('enquete_opcoes')
        .delete()
        .eq('enquete_id', enqueteId);

      // Deletar enquete
      const { error } = await supabase
        .from('enquetes')
        .delete()
        .eq('id', enqueteId);

      if (error) throw error;

      await carregarEnquetes();
      toastSuccess('Enquete excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir enquete:', error);
      toastError('Erro ao excluir enquete.');
    }
  };

  const handleEditEnquete = (enqueteId: string) => {
    navigate(`/create-poll?edit=${enqueteId}`);
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

  if (!isAdmin) {
    return null;
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
                  Gerenciar Enquetes
                </h1>
            <p className="text-gray-400">
              Controle e visualização de resultados das enquetes
              </p>
            </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/create-poll"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Nova Enquete
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => exportarEnquetesParaCSV(filteredEnquetes, 'enquetes')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => exportarEnquetesParaPDF(filteredEnquetes, 'Relatório de Enquetes')}
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
      <EnquetesMetricsCards metrics={metrics} />

        {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
          <button 
            onClick={() => setActiveTab('aberta')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'aberta' 
              ? 'border-blue-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Enquetes Abertas
          </button>
          <button 
            onClick={() => setActiveTab('encerrada')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'encerrada' 
              ? 'border-blue-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Enquetes Encerradas
          </button>
        </div>

        {/* Busca */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar enquetes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
            />
          </div>
        </div>

      {/* Tabela */}
      <EnquetesTable
        enquetes={paginatedEnquetes}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onEdit={handleEditEnquete}
        onDelete={handleDeleteEnquete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEnquetes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Confirmação - Alterar Status */}
      {showConfirmToggle && toggleStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">
              Confirmar Alteração
            </h3>
            <p className="text-gray-300 mb-6">
              Deseja realmente {toggleStatus === 'encerrada' ? 'encerrar' : 'reabrir'} esta enquete?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmToggle(null);
                  setToggleStatus(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={executeToggleStatus}
                className={`px-4 py-2 rounded transition ${
                  toggleStatus === 'encerrada'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {toggleStatus === 'encerrada' ? 'Encerrar' : 'Reabrir'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
  );
}
