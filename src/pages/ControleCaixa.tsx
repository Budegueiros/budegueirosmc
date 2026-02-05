import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Download, FileDown, RefreshCw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useFluxoCaixa } from '../hooks/useFluxoCaixa';
import { useAuth } from '../contexts/AuthContext';
import { membroService } from '../services/membroService';
import { caixaService } from '../services/caixaService';
import { FluxoCaixaComMembro } from '../types/database.types';
import CaixaMetricsCards from '../components/caixa/CaixaMetricsCards';
import CaixaTable from '../components/caixa/CaixaTable';
import FilterBarCaixa from '../components/caixa/FilterBarCaixa';
import RegistrarLancamentoModal from '../components/caixa/RegistrarSaidaModal';
import AnexoPreviewModal from '../components/caixa/AnexoPreviewModal';
import BulkActionsToolbar from '../components/caixa/BulkActionsToolbar';
import { exportarFluxoCaixaParaCSV, exportarFluxoCaixaParaPDF } from '../utils/exportHelpers';
import { groupTransactionsByDate } from '../utils/dateHelpers';

// Componentes Mobile
import CaixaHeader from '../components/caixa/mobile/CaixaHeader';
import SearchBar from '../components/caixa/mobile/SearchBar';
import CaixaSummary from '../components/caixa/mobile/CaixaSummary';
import QuickFilters from '../components/caixa/mobile/QuickFilters';
import DateSectionHeader from '../components/caixa/mobile/DateSectionHeader';
import TransactionCard from '../components/caixa/mobile/TransactionCard';
import CaixaFAB from '../components/caixa/mobile/CaixaFAB';
import EmptyState from '../components/caixa/mobile/EmptyState';

export default function ControleCaixa() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { fluxoCaixa, loading, error, refetch, deleteLancamento, updateLancamento } = useFluxoCaixa();
  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<'entrada' | 'saida'>('saida');
  const [lancamentoEdit, setLancamentoEdit] = useState<FluxoCaixaComMembro | null>(null);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [anexoUrl, setAnexoUrl] = useState<string>('');
  const [anexoFileName, setAnexoFileName] = useState<string>('');
  const [categorias, setCategorias] = useState<Array<{ nome: string; tipo: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    dataInicio: '',
    dataFim: '',
    categoria: 'todas',
    tipo: 'todos',
    apenasPendentes: false
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const carregarMembroId = async () => {
      if (!user) return;
      
      try {
        const membroIdData = await membroService.buscarIdPorUserId(user.id);
        if (membroIdData) {
          setMembroId(membroIdData);
        }
      } catch (error) {
        console.error('Erro ao carregar membro:', error);
      }
    };

    if (user) {
      carregarMembroId();
    }
  }, [user]);

  // Carregar categorias
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const categoriasData = await caixaService.buscarCategorias();
        setCategorias(categoriasData);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    carregarCategorias();
  }, []);

  // Filtrar lançamentos
  const filteredLancamentos = useMemo(() => {
    return fluxoCaixa.filter(l => {
      // Filtro de pendentes (saídas sem anexo)
      if (filters.apenasPendentes) {
        if (l.tipo !== 'saida' || l.anexo_url) return false;
      }

      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchSearch = 
          l.descricao.toLowerCase().includes(searchLower) ||
          l.membros.nome_guerra.toLowerCase().includes(searchLower) ||
          l.membros.nome_completo.toLowerCase().includes(searchLower);
        if (!matchSearch) return false;
      }

      // Filtro de data
      if (filters.dataInicio) {
        if (l.data < filters.dataInicio) return false;
      }
      if (filters.dataFim) {
        if (l.data > filters.dataFim) return false;
      }

      // Filtro de tipo
      if (filters.tipo !== 'todos' && l.tipo !== filters.tipo) return false;

      // Filtro de categoria
      if (filters.categoria !== 'todas' && l.categoria !== filters.categoria) return false;

      return true;
    });
  }, [fluxoCaixa, filters]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalEntradas = fluxoCaixa
      .filter(l => l.tipo === 'entrada')
      .reduce((acc, l) => acc + l.valor, 0);

    const totalSaidas = fluxoCaixa
      .filter(l => l.tipo === 'saida')
      .reduce((acc, l) => acc + l.valor, 0);

    const saldoAtual = totalEntradas - totalSaidas;

    const pendentesRecibo = fluxoCaixa
      .filter(l => l.tipo === 'saida' && !l.anexo_url)
      .length;

    return {
      saldoAtual,
      totalEntradas,
      totalSaidas,
      pendentesRecibo
    };
  }, [fluxoCaixa]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) {
      return;
    }

    const result = await deleteLancamento(id);
    if (!result.error) {
      toastSuccess('Lançamento excluído com sucesso!');
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      refetch();
    } else {
      toastError('Erro ao excluir lançamento.');
    }
  }, [deleteLancamento, toastSuccess, toastError, refetch]);

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    if (!confirm(`Tem certeza que deseja excluir ${count} ${count === 1 ? 'lançamento' : 'lançamentos'}?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        const result = await deleteLancamento(id);
        if (!result.error) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toastSuccess(`${successCount} ${successCount === 1 ? 'lançamento excluído' : 'lançamentos excluídos'} com sucesso!`);
      }
      if (errorCount > 0) {
        toastError(`Erro ao excluir ${errorCount} ${errorCount === 1 ? 'lançamento' : 'lançamentos'}.`);
      }

      setSelectedIds([]);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir lançamentos:', error);
      toastError('Erro ao excluir lançamentos. Tente novamente.');
    }
  }, [selectedIds, deleteLancamento, toastSuccess, toastError, refetch]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleModalSuccess = useCallback(() => {
    refetch();
    setLancamentoEdit(null);
  }, [refetch]);

  const handleEdit = useCallback((lancamento: FluxoCaixaComMembro) => {
    setLancamentoEdit(lancamento);
    setModalTipo(lancamento.tipo);
    setShowModal(true);
  }, []);

  const handleViewAnexo = useCallback((url: string, fileName?: string) => {
    setAnexoUrl(url);
    setAnexoFileName(fileName || 'Comprovante');
    setShowAnexoModal(true);
  }, []);

  const handlePendentesClick = useCallback(() => {
    setFilters({
      search: '',
      dataInicio: '',
      dataFim: '',
      categoria: 'todas',
      tipo: 'saida',
      apenasPendentes: true
    });
    // Scroll para tabela
    setTimeout(() => {
      const tableElement = document.querySelector('[data-table="caixa"]');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  // Agrupar transações por data para mobile
  const sectionedTransactions = useMemo(() => {
    return groupTransactionsByDate(filteredLancamentos);
  }, [filteredLancamentos]);

  // Contadores para filtros rápidos
  const filterCounts = useMemo(() => {
    return {
      entradas: fluxoCaixa.filter(l => l.tipo === 'entrada').length,
      saidas: fluxoCaixa.filter(l => l.tipo === 'saida').length,
    };
  }, [fluxoCaixa]);

  // Período atual para exibição
  const currentPeriod = useMemo(() => {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  const handleMobileFilterChange = (key: string, value: string) => {
    if (key === 'type') {
      setFilters({
        ...filters,
        tipo: value === 'todas' ? 'todos' : value,
      });
    }
  };

  const handleMobileSearch = (query: string) => {
    setFilters({ ...filters, search: query });
  };

  const handleMobileReportPress = () => {
    toastSuccess('Funcionalidade de relatório será implementada em breve.');
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Versão Mobile
  const mobileView = (
    <div className="lg:hidden min-h-screen bg-gray-900 pb-24">
      <CaixaHeader onReportPress={handleMobileReportPress} />

      <SearchBar
        onSearch={handleMobileSearch}
        placeholder="Buscar transação..."
        value={filters.search}
      />

      <CaixaSummary
        balance={metrics.saldoAtual}
        entradas={metrics.totalEntradas}
        saidas={metrics.totalSaidas}
        pendentes={0}
        period={currentPeriod}
        counts={filterCounts}
      />

      <QuickFilters
        filters={{ type: filters.tipo, category: filters.categoria }}
        counts={filterCounts}
        onFilterChange={handleMobileFilterChange}
      />

      {error ? (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          Erro ao carregar: {error}
        </div>
      ) : sectionedTransactions.length === 0 ? (
        <EmptyState onClearFilters={() => {
          setFilters({
            search: '',
            dataInicio: '',
            dataFim: '',
            categoria: 'todas',
            tipo: 'todos',
            apenasPendentes: false
          });
        }} />
      ) : (
        <div className="py-3">
          {sectionedTransactions.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <DateSectionHeader label={section.title} date={section.date} />
              {section.data.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewAnexo={handleViewAnexo}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <CaixaFAB
        onAddIncome={() => {
          setModalTipo('entrada');
          setShowModal(true);
        }}
        onAddExpense={() => {
          setModalTipo('saida');
          setShowModal(true);
        }}
      />
    </div>
  );

  // Versão Desktop
  const desktopView = (
    <div className="hidden lg:block min-h-screen bg-gray-900 p-6">
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
              Controle de Caixa
            </h1>
            <p className="text-gray-400">
              Gerencie entradas e saídas do caixa do moto clube
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setModalTipo('entrada');
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              disabled={!membroId}
            >
              <Plus className="w-4 h-4" />
              Nova Entrada
            </button>
            <button
              onClick={() => {
                setModalTipo('saida');
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              disabled={!membroId}
            >
              <Plus className="w-4 h-4" />
              Nova Saída
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  refetch();
                  toastSuccess('Dados atualizados!');
                }}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Atualizar dados"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <button
                onClick={() => exportarFluxoCaixaParaCSV(filteredLancamentos, 'fluxo_caixa')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => exportarFluxoCaixaParaPDF(filteredLancamentos, 'Relatório de Fluxo de Caixa')}
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
      <CaixaMetricsCards 
        metrics={metrics} 
        onPendentesClick={handlePendentesClick}
      />

      {/* Barra de Filtros */}
      <FilterBarCaixa 
        filters={filters}
        setFilters={setFilters}
        categorias={categorias}
      />

      {/* Barra de Ações em Lote */}
      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onExcluir={handleDeleteMultiple}
      />

      {/* Tabela */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          Erro ao carregar: {error}
        </div>
      ) : (
        <div data-table="caixa">
          <CaixaTable
            lancamentos={filteredLancamentos}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewAnexo={handleViewAnexo}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
      
      {/* Modal de Registro/Edição de Lançamento - Compartilhado */}
      {membroId && (
        <RegistrarLancamentoModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setLancamentoEdit(null);
          }}
          onSuccess={handleModalSuccess}
          membroId={membroId}
          tipo={modalTipo}
          lancamentoEdit={lancamentoEdit}
        />
      )}

      {/* Modal de Preview de Anexo - Compartilhado */}
      <AnexoPreviewModal
        isOpen={showAnexoModal}
        onClose={() => setShowAnexoModal(false)}
        anexoUrl={anexoUrl}
        fileName={anexoFileName}
      />
    </>
  );
}

