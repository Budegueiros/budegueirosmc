import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Plus, Loader2, Users, FileText, Download, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useMensalidades } from '../hooks/useMensalidades';
import MetricsCards from '../components/mensalidades/MetricsCards';
import FilterBar from '../components/mensalidades/FilterBar';
import MensalidadesTable from '../components/mensalidades/MensalidadesTable';
import BulkActionsToolbar from '../components/mensalidades/BulkActionsToolbar';
import MensalidadeDrawer from '../components/mensalidades/MensalidadeDrawer';
import Pagination from '../components/mensalidades/Pagination';
import { calcularStatus } from '../utils/mensalidadesHelpers';
import { exportarParaCSV, exportarParaPDF } from '../utils/exportHelpers';

// Componentes Mobile
import MensalidadesHeader from '../components/mensalidades/mobile/MensalidadesHeader';
import SearchBar from '../components/mensalidades/mobile/SearchBar';
import FinancialSummary from '../components/mensalidades/mobile/FinancialSummary';
import MensalidadeFilters from '../components/mensalidades/mobile/MensalidadeFilters';
import BulkActionsBar from '../components/mensalidades/mobile/BulkActionsBar';
import PaymentCard from '../components/mensalidades/mobile/PaymentCard';
import PaymentActionSheet from '../components/mensalidades/mobile/PaymentActionSheet';
import MonthYearPicker from '../components/mensalidades/mobile/MonthYearPicker';

interface NewMensalidade {
  membro_id: string;
  mes_referencia: string;
  valor: string;
  data_vencimento: string;
  status: string;
  link_cobranca: string;
}

export default function ManagePayments() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();
  const navigate = useNavigate();
  
  const { mensalidades, loading, error, refetch, deleteMensalidade } = useMensalidades();
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    periodo: ''
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmBatch, setShowConfirmBatch] = useState(false);
  const [membros, setMembros] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [drawerMensalidade, setDrawerMensalidade] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Estados Mobile
  const [isMobile, setIsMobile] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const [newMensalidade, setNewMensalidade] = useState<NewMensalidade>({
    membro_id: '',
    mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
    valor: '50.00',
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
    status: 'Aberto',
    link_cobranca: ''
  });

  const [batchData, setBatchData] = useState({
    mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
    valor: '50.00',
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
    status: 'Aberto',
    link_cobranca: ''
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarMembros();
    }
  }, [isAdmin]);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const carregarMembros = async () => {
    try {
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('id, nome_completo, nome_guerra, numero_carteira, ativo')
        .order('nome_guerra');

      if (membrosError) throw membrosError;
      setMembros(membrosData || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  // Filtrar mensalidades
  const filteredMensalidades = useMemo(() => {
    return mensalidades.filter(m => {
      const matchSearch = 
        m.membros.nome_guerra.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.membros.nome_completo.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.membros.numero_carteira.includes(filters.search);
      
      const matchStatus = filters.status === 'todos' || m.status === filters.status;
      const matchPeriodo = !filters.periodo || m.mes_referencia === filters.periodo;
      
      return matchSearch && matchStatus && matchPeriodo;
    });
  }, [mensalidades, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredMensalidades.length / itemsPerPage);
  const paginatedMensalidades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMensalidades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMensalidades, currentPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleRowClick = (id: string) => {
    const mensalidade = mensalidades.find(m => m.id === id);
    if (mensalidade) {
      setDrawerMensalidade(mensalidade);
      setIsDrawerOpen(true);
    }
  };

  // Handlers Mobile
  const handleToggleSelect = (paymentId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedIds.length === 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('mensalidades')
        .update({ 
          status: 'Pago',
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .in('id', selectedIds);

      if (error) throw error;

      toastSuccess(`${selectedIds.length} mensalidade(s) marcada(s) como paga(s)!`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toastError('Erro ao marcar mensalidades como pagas.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPayment = (id: string) => {
    handleRowClick(id);
  };

  const handleEditPayment = (id: string) => {
    handleEditMensalidade(id);
  };

  const handleMoreActions = (id: string) => {
    const payment = mensalidades.find(p => p.id === id);
    setSelectedPayment(payment);
    setActionSheetVisible(true);
  };

  const handleMarkAsPaid = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mensalidades')
        .update({ 
          status: 'Pago',
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;

      toastSuccess('Mensalidade marcada como paga!');
      refetch();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toastError('Erro ao marcar como pago.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsUnpaid = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mensalidades')
        .update({ 
          status: 'Aberto',
          data_pagamento: null
        })
        .eq('id', id);

      if (error) throw error;

      toastSuccess('Mensalidade marcada como não paga!');
      refetch();
    } catch (error) {
      console.error('Erro ao marcar como não pago:', error);
      toastError('Erro ao marcar como não pago.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (id: string) => {
    toastInfo('Função de envio de lembretes será implementada em breve.');
  };

  const handleDeletePayment = async (id: string) => {
    await handleDeleteMensalidade(id);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setSelectedIds([]);
  };

  const handlePeriodoSelect = (periodo: string) => {
    setFilters({ ...filters, periodo });
  };

  // Obter mês e ano atual para o resumo
  const getCurrentPeriod = () => {
    const periodo = filters.periodo || new Date().toISOString().slice(0, 7) + '-01';
    const date = new Date(periodo + 'T00:00:00');
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'long' }),
      year: date.getFullYear(),
      periodo,
    };
  };

  const currentPeriod = getCurrentPeriod();

  // Calcular estatísticas para mobile
  const mobileStats = useMemo(() => {
    const periodoAtual = filters.periodo || new Date().toISOString().slice(0, 7) + '-01';
    const mensalidadesFiltradas = filteredMensalidades.filter(m => 
      !filters.periodo || m.mes_referencia === periodoAtual
    );

    const arrecadado = mensalidadesFiltradas
      .filter(m => {
        const status = calcularStatus(m);
        const statusOriginal = (m.status?.trim() || '').toLowerCase();
        return status === 'Pago' || statusOriginal === 'pago' || !!m.data_pagamento;
      })
      .reduce((acc, m) => acc + m.valor, 0);

    const pendente = mensalidadesFiltradas
      .filter(m => {
        const status = calcularStatus(m);
        const statusOriginal = m.status?.trim() || '';
        return (status === 'Aberto' || status === 'Pendente' || 
                statusOriginal === 'Aberto' || statusOriginal === 'Pendente') &&
               new Date(m.data_vencimento) >= new Date();
      })
      .reduce((acc, m) => acc + m.valor, 0);

    const atrasado = mensalidadesFiltradas
      .filter(m => {
        const status = calcularStatus(m);
        return status === 'Atrasado';
      })
      .reduce((acc, m) => acc + m.valor, 0);

    const pagoCount = mensalidadesFiltradas.filter(m => {
      const status = calcularStatus(m);
      const statusOriginal = (m.status?.trim() || '').toLowerCase();
      return status === 'Pago' || statusOriginal === 'pago' || !!m.data_pagamento;
    }).length;

    return {
      arrecadado,
      pendente,
      atrasado,
      pagoCount,
      totalCount: mensalidadesFiltradas.length,
    };
  }, [filteredMensalidades, filters.periodo]);

  // Contadores para filtros mobile
  const filterCounts = useMemo(() => {
    return {
      pago: filteredMensalidades.filter(m => {
        const status = calcularStatus(m);
        const statusOriginal = (m.status?.trim() || '').toLowerCase();
        return status === 'Pago' || statusOriginal === 'pago' || !!m.data_pagamento;
      }).length,
      aberto: filteredMensalidades.filter(m => {
        const status = calcularStatus(m);
        return status === 'Aberto' || status === 'Pendente';
      }).length,
      atrasado: filteredMensalidades.filter(m => {
        const status = calcularStatus(m);
        return status === 'Atrasado';
      }).length,
    };
  }, [filteredMensalidades]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Filtrar mensalidades do mês atual que estão pagas
    // Considera pago se: status for 'Pago' OU data_pagamento estiver preenchida
    const mesAtualStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`; // Formato: "2026-01"
    
    const mensalidadesMesAtualPagas = mensalidades.filter(m => {
      // Verificar se está pago (status ou data_pagamento)
      const statusCalculado = calcularStatus(m);
      const statusOriginal = (m.status?.trim() || '').toLowerCase();
      const temDataPagamento = !!m.data_pagamento;
      const estaPago = statusCalculado === 'Pago' || statusOriginal === 'pago' || temDataPagamento;
      
      if (!estaPago) return false;
      
      // Comparar mês/ano usando string (mais confiável que Date)
      const mesRef = m.mes_referencia.trim();
      // Extrair YYYY-MM do mes_referencia
      const mesRefStr = mesRef.substring(0, 7); // Pega "YYYY-MM" de "YYYY-MM-DD" ou "YYYY-MM"
      
      // Comparar strings diretamente
      return mesRefStr === mesAtualStr;
    });

    return {
      totalArrecadado: mensalidadesMesAtualPagas
        .reduce((acc, m) => acc + m.valor, 0),
      totalPendente: mensalidades
        .filter(m => {
          const status = calcularStatus(m);
          const statusOriginal = m.status?.trim() || '';
          return status === 'Aberto' || status === 'Pendente' || 
                 statusOriginal === 'Aberto' || statusOriginal === 'Pendente';
        })
        .reduce((acc, m) => acc + m.valor, 0),
      totalAtrasado: mensalidades
        .filter(m => {
          const status = calcularStatus(m);
          return status === 'Atrasado';
        })
        .reduce((acc, m) => acc + m.valor, 0),
      taxaConversao: mensalidades.length > 0
        ? (mensalidades.filter(m => {
            const statusCalculado = calcularStatus(m);
            const statusOriginal = (m.status?.trim() || '').toLowerCase();
            return statusCalculado === 'Pago' || statusOriginal === 'pago';
          }).length / mensalidades.length) * 100
        : 0
    };
  }, [mensalidades]);

  const handleCreateMensalidade = async () => {
    if (!newMensalidade.membro_id) {
      toastWarning('Selecione um integrante');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('mensalidades').insert({
        membro_id: newMensalidade.membro_id,
        mes_referencia: newMensalidade.mes_referencia,
        valor: parseFloat(newMensalidade.valor),
        data_vencimento: newMensalidade.data_vencimento,
        status: newMensalidade.status,
        link_cobranca: newMensalidade.link_cobranca || null
      });

      if (error) throw error;

      toastSuccess('Mensalidade criada com sucesso!');
      setShowNewForm(false);
      setNewMensalidade({
        membro_id: '',
        mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
        valor: '50.00',
        data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
        status: 'Aberto',
        link_cobranca: ''
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar mensalidade:', error);
      toastError('Erro ao criar mensalidade. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBatch = () => {
    setShowConfirmBatch(true);
  };

  const executeGenerateBatch = async () => {
    setShowConfirmBatch(false);
    setSaving(true);
    try {
      const { data: membrosAtivos, error: membrosError } = await supabase
        .from('membros')
        .select('id')
        .eq('ativo', true);

      if (membrosError) throw membrosError;

      if (!membrosAtivos || membrosAtivos.length === 0) {
        toastWarning('Nenhum membro ativo encontrado.');
        return;
      }

      const { data: mensalidadesExistentes, error: existentesError } = await supabase
        .from('mensalidades')
        .select('membro_id')
        .eq('mes_referencia', batchData.mes_referencia);

      if (existentesError) throw existentesError;

      const idsComMensalidade = new Set(mensalidadesExistentes?.map(m => m.membro_id) || []);
      const membrosParaCriar = membrosAtivos.filter(m => !idsComMensalidade.has(m.id));

      if (membrosParaCriar.length === 0) {
        toastInfo('Todos os integrantes ativos já possuem mensalidade para este mês.');
        return;
      }

      const mensalidadesParaInserir = membrosParaCriar.map(membro => ({
        membro_id: membro.id,
        mes_referencia: batchData.mes_referencia,
        valor: parseFloat(batchData.valor),
        data_vencimento: batchData.data_vencimento,
        status: batchData.status,
        link_cobranca: batchData.link_cobranca || null
      }));

      const { error: insertError } = await supabase
        .from('mensalidades')
        .insert(mensalidadesParaInserir);

      if (insertError) throw insertError;

      const mensagem = idsComMensalidade.size > 0 
        ? `${membrosParaCriar.length} mensalidades criadas com sucesso! (${idsComMensalidade.size} integrantes já tinham mensalidade neste mês)`
        : `${membrosParaCriar.length} mensalidades criadas com sucesso!`;
      toastSuccess(mensagem);
      setShowBatchForm(false);
      setBatchData({
        mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
        valor: '50.00',
        data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
        status: 'Aberto',
        link_cobranca: ''
      });
      refetch();
    } catch (error) {
      console.error('Erro ao gerar mensalidades em lote:', error);
      toastError('Erro ao gerar mensalidades em lote. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMensalidade = (id: string) => {
    const mensalidade = mensalidades.find(m => m.id === id);
    if (!mensalidade) return;

    setEditingId(id);
    setEditingData({
      valor: mensalidade.valor.toString(),
      data_vencimento: mensalidade.data_vencimento,
      data_pagamento: mensalidade.data_pagamento || '',
      status: mensalidade.status,
      link_cobranca: mensalidade.link_cobranca || '',
      forma_pagamento: mensalidade.forma_pagamento || '',
      observacao: mensalidade.observacao || ''
    });
  };

  const handleSaveMensalidade = async () => {
    if (!editingId || !editingData) return;

    setSaving(true);
    try {
      const updateData: any = {
        valor: parseFloat(editingData.valor),
        data_vencimento: editingData.data_vencimento,
        status: editingData.status,
        link_cobranca: editingData.link_cobranca || null,
        forma_pagamento: editingData.forma_pagamento || null,
        observacao: editingData.observacao || null,
        updated_at: new Date().toISOString()
      };

      if (editingData.status === 'Pago' && !editingData.data_pagamento) {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
      } else if (editingData.data_pagamento) {
        updateData.data_pagamento = editingData.data_pagamento;
      }

      const { error } = await supabase
        .from('mensalidades')
        .update(updateData)
        .eq('id', editingId);

      if (error) throw error;

      toastSuccess('Mensalidade atualizada com sucesso!');
      setEditingId(null);
      setEditingData(null);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar mensalidade:', error);
      toastError('Erro ao atualizar mensalidade. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMensalidade = async (id: string) => {
    const result = await deleteMensalidade(id);
    if (!result.error) {
      toastSuccess('Mensalidade excluída com sucesso!');
    } else {
      toastError('Erro ao excluir mensalidade.');
    }
  };

  const handleGerarCobrancas = async () => {
    if (selectedIds.length === 0) {
      toastWarning('Selecione pelo menos uma mensalidade');
      return;
    }

    const mensalidadesSelecionadas = mensalidades.filter(m => selectedIds.includes(m.id));
    const semLinkCobranca = mensalidadesSelecionadas.filter(m => !m.link_cobranca);

    if (semLinkCobranca.length > 0) {
      toastWarning(`${semLinkCobranca.length} mensalidade(s) não possuem código PIX. Adicione o código PIX antes de gerar cobranças.`);
      return;
    }

    // Aqui você pode implementar a lógica de gerar cobranças
    // Por exemplo, copiar todos os códigos PIX ou gerar um arquivo
    const codigosPix = mensalidadesSelecionadas
      .map(m => `${m.membros.nome_guerra}: ${m.link_cobranca}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(codigosPix);
      toastSuccess(`${selectedIds.length} código(s) PIX copiado(s) para a área de transferência!`);
    } catch (error) {
      console.error('Erro ao copiar códigos PIX:', error);
      toastError('Erro ao copiar códigos PIX');
    }
  };

  const handleEnviarLembretes = async () => {
    if (selectedIds.length === 0) {
      toastWarning('Selecione pelo menos uma mensalidade');
      return;
    }

    const mensalidadesSelecionadas = mensalidades.filter(m => selectedIds.includes(m.id));
    
    // Aqui você pode implementar a lógica de enviar lembretes
    // Por exemplo, enviar emails ou notificações
    toastInfo(`Função de envio de lembretes será implementada em breve. ${selectedIds.length} mensalidade(s) selecionada(s).`);
    
    // TODO: Implementar envio de lembretes via email/notificação
    // Por enquanto, apenas mostra uma mensagem informativa
  };

  const formatarMes = (mesReferencia: string) => {
    const date = new Date(mesReferencia + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        <MensalidadesHeader
          onReportPress={() => {
            // Navegar para relatório ou abrir modal
            toastInfo('Funcionalidade de relatório será implementada em breve.');
          }}
        />

        <SearchBar
          onSearch={(query) => setFilters({ ...filters, search: query })}
          placeholder="Buscar membro..."
        />

        <FinancialSummary
          stats={mobileStats}
          currentMonth={currentPeriod.month}
          currentYear={currentPeriod.year}
        />

        <MensalidadeFilters
          filters={{ status: filters.status, periodo: filters.periodo }}
          counts={filterCounts}
          onFilterChange={handleFilterChange}
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onMarkAsPaid={handleBulkMarkAsPaid}
          onClear={() => setSelectedIds([])}
        />

        {error ? (
          <div className="mx-4 mt-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
            Erro ao carregar: {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredMensalidades.length === 0 ? (
          <div className="mx-4 mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-base mb-2">Nenhuma mensalidade encontrada</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {filteredMensalidades.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                isSelected={selectedIds.includes(payment.id)}
                onToggleSelect={() => handleToggleSelect(payment.id)}
                onView={handleViewPayment}
                onEdit={handleEditPayment}
                onMoreActions={handleMoreActions}
              />
            ))}
          </div>
        )}

        {/* FAB para nova mensalidade */}
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            setShowNewForm(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition"
        >
          <Plus className="w-6 h-6" />
        </Link>

        {/* Action Sheet */}
        <PaymentActionSheet
          visible={actionSheetVisible}
          onClose={() => {
            setActionSheetVisible(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onMarkAsPaid={handleMarkAsPaid}
          onMarkAsUnpaid={handleMarkAsUnpaid}
          onSendReminder={handleSendReminder}
          onDelete={handleDeletePayment}
        />

        {/* Month Year Picker */}
        <MonthYearPicker
          visible={showMonthPicker}
          onClose={() => setShowMonthPicker(false)}
          onSelect={handlePeriodoSelect}
          initialPeriodo={filters.periodo}
        />

        {/* Drawer de Detalhes */}
        <MensalidadeDrawer
          mensalidade={drawerMensalidade}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setDrawerMensalidade(null);
          }}
          onRefresh={refetch}
        />

        {/* Modal de Edição Mobile */}
        {editingId && editingData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-white text-xl font-bold mb-4">Editar Mensalidade</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.valor}
                    onChange={(e) => setEditingData({ ...editingData, valor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                  <select
                    value={editingData.status}
                    onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                    <option value="Isento">Isento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                  <input
                    type="date"
                    value={editingData.data_vencimento}
                    onChange={(e) => setEditingData({ ...editingData, data_vencimento: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Data Pagamento</label>
                  <input
                    type="date"
                    value={editingData.data_pagamento}
                    onChange={(e) => setEditingData({ ...editingData, data_pagamento: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Forma de Pagamento</label>
                  <input
                    type="text"
                    value={editingData.forma_pagamento}
                    onChange={(e) => setEditingData({ ...editingData, forma_pagamento: e.target.value })}
                    placeholder="PIX, Dinheiro, Transferência..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX Copia e Cola</label>
                  <input
                    type="text"
                    value={editingData.link_cobranca}
                    onChange={(e) => setEditingData({ ...editingData, link_cobranca: e.target.value })}
                    placeholder="00020126..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-600 font-mono text-xs"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">Observação</label>
                  <textarea
                    value={editingData.observacao}
                    onChange={(e) => setEditingData({ ...editingData, observacao: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditingData(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMensalidade}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Versão Desktop (mantém código original)
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
                  Gerenciar Mensalidades
                </h1>
            <p className="text-gray-400">
              Controle de pagamentos e mensalidades dos sócios
              </p>
            </div>

          <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowBatchForm(!showBatchForm)}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Users className="w-4 h-4" />
              Gerar Mensalidades
              </button>
              <button
                onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Nova Mensalidade
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarParaCSV(filteredMensalidades, 'mensalidades')}
                  className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  title="Exportar para CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  onClick={() => exportarParaPDF(filteredMensalidades, 'Relatório de Mensalidades')}
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
      <MetricsCards metrics={metrics} />

        {/* Formulário Gerar em Lote */}
        {showBatchForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="text-white text-lg font-bold mb-2">Gerar Mensalidades em Lote</h3>
            <p className="text-gray-400 text-sm mb-4">
              Cria mensalidades para todos os integrantes ativos que ainda não possuem lançamento no mês selecionado
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Mês Referência</label>
                <input
                  type="month"
                  value={batchData.mes_referencia.slice(0, 7)}
                  onChange={(e) => setBatchData({ ...batchData, mes_referencia: e.target.value + '-01' })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Valor Padrão (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={batchData.valor}
                  onChange={(e) => setBatchData({ ...batchData, valor: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={batchData.data_vencimento}
                  onChange={(e) => setBatchData({ ...batchData, data_vencimento: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={batchData.status}
                  onChange={(e) => setBatchData({ ...batchData, status: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX Copia e Cola (Opcional)</label>
                <input
                  type="text"
                  placeholder="00020126..." 
                  value={batchData.link_cobranca}
                  onChange={(e) => setBatchData({ ...batchData, link_cobranca: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-600 font-mono text-xs"
                  disabled={saving}
                />
              </div>
            </div>

          <div className="flex gap-2 mt-4">
              <button
                onClick={handleGenerateBatch}
                disabled={saving}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Gerar para Todos os Integrantes Ativos
              </button>
              <button
                onClick={() => setShowBatchForm(false)}
                disabled={saving}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Formulário Nova Mensalidade */}
        {showNewForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="text-white text-lg font-bold mb-4">Nova Mensalidade</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Integrante</label>
                <select
                  value={newMensalidade.membro_id}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, membro_id: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="">Selecione um integrante</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome_guerra} ({m.numero_carteira})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Mês Referência</label>
                <input
                  type="month"
                  value={newMensalidade.mes_referencia.slice(0, 7)}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, mes_referencia: e.target.value + '-01' })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMensalidade.valor}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, valor: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={newMensalidade.data_vencimento}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, data_vencimento: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={newMensalidade.status}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, status: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Isento">Isento</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX Copia e Cola</label>
                <input
                  type="text"
                  value={newMensalidade.link_cobranca}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, link_cobranca: e.target.value })}
                  placeholder="00020126..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-600 font-mono text-xs"
                  disabled={saving}
                />
              </div>
            </div>

          <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateMensalidade}
                disabled={saving}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50 text-sm"
              >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                Criar
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                disabled={saving}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Toolbar de ações em lote */}
      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onGerarCobrancas={handleGerarCobrancas}
        onEnviarLembretes={handleEnviarLembretes}
      />

      {/* Tabela */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          Erro ao carregar: {error}
        </div>
      ) : (
        <>
          <MensalidadesTable
            mensalidades={paginatedMensalidades}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onDelete={handleDeleteMensalidade}
            onEdit={handleEditMensalidade}
            onRowClick={handleRowClick}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMensalidades.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Drawer de Detalhes */}
      <MensalidadeDrawer
        mensalidade={drawerMensalidade}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerMensalidade(null);
        }}
        onRefresh={refetch}
      />

      {/* Modal de Edição */}
      {editingId && editingData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-xl font-bold mb-4">Editar Mensalidade</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Valor (R$)</label>
            <input
                  type="number"
                  step="0.01"
                  value={editingData.valor}
                  onChange={(e) => setEditingData({ ...editingData, valor: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
            />
          </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
          <select
                  value={editingData.status}
                  onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
            <option value="Aberto">Aberto</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Isento">Isento</option>
          </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={editingData.data_vencimento}
                  onChange={(e) => setEditingData({ ...editingData, data_vencimento: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
          </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Pagamento</label>
                <input
                  type="date"
                  value={editingData.data_pagamento}
                  onChange={(e) => setEditingData({ ...editingData, data_pagamento: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
        </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Forma de Pagamento</label>
                <input
                  type="text"
                  value={editingData.forma_pagamento}
                  onChange={(e) => setEditingData({ ...editingData, forma_pagamento: e.target.value })}
                  placeholder="PIX, Dinheiro, Transferência..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
            </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX Copia e Cola</label>
                <input
                  type="text"
                  value={editingData.link_cobranca}
                  onChange={(e) => setEditingData({ ...editingData, link_cobranca: e.target.value })}
                  placeholder="00020126..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-600 font-mono text-xs"
                  disabled={saving}
                />
                  </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Observação</label>
                <textarea
                  value={editingData.observacao}
                  onChange={(e) => setEditingData({ ...editingData, observacao: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  rows={2}
                  disabled={saving}
                />
                  </div>
                </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingData(null);
                }}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMensalidade}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
        </div>
      </div>
        </div>
      )}

      {/* Modal de Confirmação - Gerar em Lote */}
      {showConfirmBatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">
              Confirmar Geração em Lote
            </h3>
            <p className="text-gray-300 mb-4">
              Deseja gerar mensalidades para todos os integrantes ativos?
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Mês:</span>
                <span className="text-white font-semibold capitalize">{formatarMes(batchData.mes_referencia)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor:</span>
                <span className="text-white font-semibold">R$ {parseFloat(batchData.valor).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmBatch(false)}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeGenerateBatch}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
