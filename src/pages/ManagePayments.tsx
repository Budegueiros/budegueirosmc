import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Search, Edit2, Trash2, ArrowLeft, Plus, Loader2, Save, X, Check, Users, Calendar, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';

interface Mensalidade {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  link_cobranca: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

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
  
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'none' | 'membro' | 'mes' | 'status'>('none');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmBatch, setShowConfirmBatch] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [newMensalidade, setNewMensalidade] = useState<NewMensalidade>({
    membro_id: '',
    mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
    valor: '50.00',
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
    status: 'Aberto',
    link_cobranca: ''
  });

  const [editingData, setEditingData] = useState<any>(null);
  const [membros, setMembros] = useState<any[]>([]);

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
      carregarDados();
    }
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar mensalidades com dados dos membros (incluindo membros inativos)
      const { data: mensalidadesData, error: mensalidadesError } = await supabase
        .from('mensalidades')
        .select(`
          *,
          membros!inner (
            nome_completo,
            nome_guerra,
            numero_carteira
          )
        `)
        .order('mes_referencia', { ascending: false });

      if (mensalidadesError) {
        console.error('Erro ao carregar mensalidades:', mensalidadesError);
        throw mensalidadesError;
      }
      
      setMensalidades(mensalidadesData || []);

      // Carregar lista de membros para o formulário (incluindo inativos para exibição)
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('id, nome_completo, nome_guerra, numero_carteira, ativo')
        .order('nome_guerra');

      if (membrosError) throw membrosError;
      setMembros(membrosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toastError('Erro ao carregar dados. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

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
      carregarDados();
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
      // Buscar todos os membros ativos
      const { data: membrosAtivos, error: membrosError } = await supabase
        .from('membros')
        .select('id')
        .eq('ativo', true);

      if (membrosError) throw membrosError;

      if (!membrosAtivos || membrosAtivos.length === 0) {
        toastWarning('Nenhum membro ativo encontrado.');
        return;
      }

      // Verificar quais membros já têm mensalidade para este mês
      const { data: mensalidadesExistentes, error: existentesError } = await supabase
        .from('mensalidades')
        .select('membro_id')
        .eq('mes_referencia', batchData.mes_referencia);

      if (existentesError) throw existentesError;

      const idsComMensalidade = new Set(mensalidadesExistentes?.map(m => m.membro_id) || []);

      // Filtrar apenas membros que ainda não têm mensalidade neste mês
      const membrosParaCriar = membrosAtivos.filter(m => !idsComMensalidade.has(m.id));

      if (membrosParaCriar.length === 0) {
        toastInfo('Todos os integrantes ativos já possuem mensalidade para este mês.');
        return;
      }

      // Criar mensalidades em lote
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
      carregarDados();
    } catch (error) {
      console.error('Erro ao gerar mensalidades em lote:', error);
      toastError('Erro ao gerar mensalidades em lote. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMensalidade = (mensalidade: Mensalidade) => {
    setEditingId(mensalidade.id);
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

  const handleSaveMensalidade = async (id: string) => {
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

      // Se foi marcado como pago, adicionar data de pagamento se não tiver
      if (editingData.status === 'Pago' && !editingData.data_pagamento) {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
      } else if (editingData.data_pagamento) {
        updateData.data_pagamento = editingData.data_pagamento;
      }

      const { error } = await supabase
        .from('mensalidades')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditingData(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar mensalidade:', error);
      toastError('Erro ao atualizar mensalidade. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMensalidade = (id: string) => {
    setDeleteId(id);
  };

  const executeDeleteMensalidade = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('mensalidades')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      carregarDados();
      toastSuccess('Mensalidade excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir mensalidade:', error);
      toastError('Erro ao excluir mensalidade.');
      setDeleteId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const mensalidadesFiltradas = mensalidades.filter(m => {
    const matchSearch = 
      m.membros.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.membros.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.membros.numero_carteira.includes(searchTerm);
    
    const matchStatus = !filterStatus || m.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const formatarMes = (mesReferencia: string) => {
    const date = new Date(mesReferencia + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Função para agrupar mensalidades
  const agruparMensalidades = () => {
    if (groupBy === 'none') {
      return { 'Todas': mensalidadesFiltradas };
    }

    const grupos: Record<string, Mensalidade[]> = {};

    mensalidadesFiltradas.forEach(m => {
      let key = '';
      
      if (groupBy === 'membro') {
        key = `${m.membros.nome_guerra} - ${m.membros.numero_carteira}`;
      } else if (groupBy === 'mes') {
        key = formatarMes(m.mes_referencia);
      } else if (groupBy === 'status') {
        key = m.status;
      }

      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(m);
    });

    return grupos;
  };

  const grupos = agruparMensalidades();
  const gruposOrdenados = Object.entries(grupos).sort((a, b) => {
    if (groupBy === 'mes') {
      // Ordenar meses por data (mais recente primeiro)
      return b[1][0].mes_referencia.localeCompare(a[1][0].mes_referencia);
    } else if (groupBy === 'status') {
      // Ordenar status: Pago, Isento, Aberto, Pendente, Atrasado
      const ordem: Record<string, number> = { 'Pago': 0, 'Isento': 1, 'Aberto': 2, 'Pendente': 3, 'Atrasado': 4 };
      return (ordem[a[0]] ?? 99) - (ordem[b[0]] ?? 99);
    }
    return a[0].localeCompare(b[0]);
  });

  const formatarData = (data: string) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'text-green-500 bg-green-950/30 border-green-600/50';
      case 'Aberto':
      case 'Pendente':
        return 'text-yellow-500 bg-yellow-950/30 border-yellow-600/50';
      case 'Atrasado':
        return 'text-red-500 bg-red-950/30 border-red-600/50';
      case 'Isento':
        return 'text-blue-500 bg-blue-950/30 border-blue-600/50';
      default:
        return 'text-gray-500 bg-gray-950/30 border-gray-600/50';
    }
  };

  // Função para renderizar card de mensalidade
  const renderMensalidadeCard = (mensalidade: Mensalidade) => (
    <div
      key={mensalidade.id}
      className="bg-brand-gray border border-brand-red/30 rounded-xl p-5"
    >
      {editingId === mensalidade.id && editingData ? (
        /* Modo de Edição */
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-oswald text-lg uppercase font-bold">
              Editando: {mensalidade.membros.nome_guerra}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveMensalidade(mensalidade.id)}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editingData.valor}
                onChange={(e) => setEditingData({ ...editingData, valor: e.target.value })}
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
              <select
                value={editingData.status}
                onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs uppercase mb-1">Data Pagamento</label>
              <input
                type="date"
                value={editingData.data_pagamento}
                onChange={(e) => setEditingData({ ...editingData, data_pagamento: e.target.value })}
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX</label>
              <input
                type="text"
                value={editingData.link_cobranca}
                onChange={(e) => setEditingData({ ...editingData, link_cobranca: e.target.value })}
                placeholder="00020126..."
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red font-mono text-xs"
                disabled={saving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 text-xs uppercase mb-1">Observação</label>
              <textarea
                value={editingData.observacao}
                onChange={(e) => setEditingData({ ...editingData, observacao: e.target.value })}
                className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                rows={2}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Modo de Visualização */
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-oswald text-lg uppercase font-bold">
                {mensalidade.membros.nome_guerra}
              </h3>
              <p className="text-gray-400 text-sm">
                {mensalidade.membros.nome_completo} - Carteira: {mensalidade.membros.numero_carteira}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditMensalidade(mensalidade)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                title="Editar"
              >
                <Edit2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => handleDeleteMensalidade(mensalidade.id)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded transition"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-xs uppercase">Mês Referência</p>
              <p className="text-white font-semibold capitalize">{formatarMes(mensalidade.mes_referencia)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Valor</p>
              <p className="text-white font-semibold">R$ {mensalidade.valor.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Vencimento</p>
              <p className="text-white font-semibold">{formatarData(mensalidade.data_vencimento)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Status</p>
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold border ${getStatusColor(mensalidade.status)}`}>
                {mensalidade.status}
              </span>
            </div>
          </div>

          {mensalidade.data_pagamento && (
            <div className="mb-2">
              <p className="text-gray-500 text-xs uppercase">Pago em</p>
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {formatarData(mensalidade.data_pagamento)}
                {mensalidade.forma_pagamento && ` - ${mensalidade.forma_pagamento}`}
              </p>
            </div>
          )}

          {mensalidade.link_cobranca && (
            <div className="mb-2">
              <p className="text-gray-500 text-xs uppercase mb-1">Link de Cobrança</p>
              <a
                href={mensalidade.link_cobranca}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-red hover:text-red-400 text-sm underline"
              >
                Acessar link de pagamento
              </a>
            </div>
          )}

          {mensalidade.observacao && (
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Observação</p>
              <p className="text-gray-300 text-sm">{mensalidade.observacao}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-brand-red" />
                <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
                  Gerenciar Mensalidades
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Controle de pagamentos mensais dos integrantes
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBatchForm(!showBatchForm)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                Gerar Lote
              </button>
              <button
                onClick={() => setShowNewForm(!showNewForm)}
                className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Nova Mensalidade
              </button>
            </div>
          </div>
        </div>

        {/* Formulário Gerar em Lote */}
        {showBatchForm && (
          <div className="bg-brand-gray border border-green-600/30 rounded-xl p-5 mb-6">
            <h3 className="text-white font-oswald text-lg uppercase font-bold mb-2">Gerar Mensalidades em Lote</h3>
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
                  className="w-full bg-black border border-green-600/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600"
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
                  className="w-full bg-black border border-green-600/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={batchData.data_vencimento}
                  onChange={(e) => setBatchData({ ...batchData, data_vencimento: e.target.value })}
                  className="w-full bg-black border border-green-600/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={batchData.status}
                  onChange={(e) => setBatchData({ ...batchData, status: e.target.value })}
                  className="w-full bg-black border border-green-600/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600"
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
                  className="w-full bg-black border border-green-600/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600 font-mono text-xs"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleGenerateBatch}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Gerar para Todos os Integrantes Ativos
              </button>
              <button
                onClick={() => setShowBatchForm(false)}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Formulário Nova Mensalidade */}
        {showNewForm && (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-5 mb-6">
            <h3 className="text-white font-oswald text-lg uppercase font-bold mb-4">Nova Mensalidade</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Integrante</label>
                <select
                  value={newMensalidade.membro_id}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, membro_id: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={newMensalidade.data_vencimento}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, data_vencimento: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={newMensalidade.status}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, status: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                <label className="block text-gray-400 text-xs uppercase mb-1">Código PIX</label>
                <input
                  type="text"
                  value={newMensalidade.link_cobranca}
                  onChange={(e) => setNewMensalidade({ ...newMensalidade, link_cobranca: e.target.value })}
                  placeholder="00020126..."
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red font-mono text-xs"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateMensalidade}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Criar
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou número da carteira..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-brand-gray border border-brand-red/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
          >
            <option value="">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Isento">Isento</option>
          </select>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'membro' | 'mes' | 'status')}
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-red appearance-none"
            >
              <option value="none">Sem Agrupamento</option>
              <option value="membro">Agrupar por Usuário</option>
              <option value="mes">Agrupar por Mês</option>
              <option value="status">Agrupar por Status</option>
          </select>
          </div>
        </div>

        {/* Lista de Mensalidades */}
        <div className="space-y-4">
          {mensalidadesFiltradas.length === 0 ? (
            <div className="text-center py-12 bg-brand-gray border border-brand-red/30 rounded-xl">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma mensalidade encontrada.</p>
            </div>
          ) : groupBy === 'none' ? (
            // Modo sem agrupamento (listagem padrão)
            mensalidadesFiltradas.map((mensalidade) => (
              renderMensalidadeCard(mensalidade)
            ))
          ) : (
            // Modo com agrupamento
            gruposOrdenados.map(([grupoKey, mensalidadesGrupo]) => {
              const totalGrupo = mensalidadesGrupo.reduce((sum, m) => sum + m.valor, 0);
              const totalPago = mensalidadesGrupo.filter(m => m.status === 'Pago').reduce((sum, m) => sum + m.valor, 0);
              const countTotal = mensalidadesGrupo.length;
              const countPago = mensalidadesGrupo.filter(m => m.status === 'Pago').length;

              return (
                <div key={grupoKey} className="space-y-3">
                  {/* Cabeçalho do Grupo */}
                  <div className="bg-gradient-to-r from-brand-red/20 to-transparent border border-brand-red/30 rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        {groupBy === 'membro' && <Users className="w-5 h-5 text-brand-red" />}
                        {groupBy === 'mes' && <Calendar className="w-5 h-5 text-brand-red" />}
                        {groupBy === 'status' && <Filter className="w-5 h-5 text-brand-red" />}
                        <div>
                          <h3 className="text-white font-oswald text-lg uppercase font-bold">
                            {grupoKey}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {countTotal} mensalidade{countTotal !== 1 ? 's' : ''}
                            {countPago > 0 && ` • ${countPago} paga${countPago !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs uppercase">Total do Grupo</p>
                        <p className="text-white font-bold text-lg">R$ {totalGrupo.toFixed(2)}</p>
                        {totalPago > 0 && (
                          <p className="text-green-400 text-sm">R$ {totalPago.toFixed(2)} pago</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensalidades do Grupo */}
                  <div className="space-y-3 ml-4 md:ml-8">
                    {mensalidadesGrupo.map((mensalidade) => renderMensalidadeCard(mensalidade))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmação - Gerar em Lote */}
      {showConfirmBatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Confirmar Geração em Lote
            </h3>
            <p className="text-gray-300 mb-4">
              Deseja gerar mensalidades para todos os integrantes ativos?
            </p>
            <div className="bg-black/50 border border-brand-red/20 rounded-lg p-4 mb-4 space-y-2">
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

      {/* Modal de Confirmação - Excluir Mensalidade */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir esta mensalidade?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteMensalidade}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
