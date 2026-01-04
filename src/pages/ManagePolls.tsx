import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Search, Edit2, ArrowLeft, X, Loader2, Save, Users, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/DashboardLayout';

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
  created_by: string;
}

interface Opcao {
  id: string;
  texto: string;
  ordem: number;
}

interface Votante {
  membro_id: string;
  nome_guerra: string;
  opcao_id?: string;
  opcao_texto?: string;
  texto_livre?: string;
  created_at: string;
}

interface EnqueteComEstatisticas extends Enquete {
  total_votos: number;
  opcoes?: OpcaoComVotos[];
  votos_texto_livre?: string[];
  votantes?: Votante[];
}

interface OpcaoComVotos extends Opcao {
  votos: number;
  percentual: number;
  votantes?: Votante[];
}

interface EditingEnquete {
  titulo: string;
  descricao: string;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  opcoes: Opcao[];
}

export default function ManagePolls() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [enquetes, setEnquetes] = useState<EnqueteComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingEnquete | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'aberta' | 'encerrada'>('aberta');
  const [enquetesExpandidas, setEnquetesExpandidas] = useState<Record<string, boolean>>({});
  const [showConfirmToggle, setShowConfirmToggle] = useState<string | null>(null);
  const [toggleStatus, setToggleStatus] = useState<'aberta' | 'encerrada' | null>(null);

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
          // Contar total de votos
          const { count: totalVotos } = await supabase
            .from('votos')
            .select('*', { count: 'exact', head: true })
            .eq('enquete_id', enquete.id);

          // Buscar todos os votos
          const { data: votosData } = await supabase
            .from('votos')
            .select('membro_id, opcao_id, texto_livre, created_at')
            .eq('enquete_id', enquete.id);

          // Buscar informações dos membros que votaram
          const membrosIds = [...new Set(votosData?.map(v => v.membro_id) || [])];
          const { data: membrosData } = await supabase
            .from('membros')
            .select('id, nome_guerra')
            .in('id', membrosIds);

          // Criar mapa de membros
          const membrosMap = new Map(membrosData?.map(m => [m.id, m.nome_guerra]) || []);

          if (enquete.tipo === 'multipla_escolha') {
            // Buscar opções
            const { data: opcoesData } = await supabase
              .from('enquete_opcoes')
              .select('*')
              .eq('enquete_id', enquete.id)
              .order('ordem');

            const votosPorOpcao = votosData?.reduce((acc, v) => {
              if (v.opcao_id) {
                acc[v.opcao_id] = (acc[v.opcao_id] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>) || {};

            // Mapear votantes por opção
            const votantesPorOpcao: Record<string, Votante[]> = {};
            votosData?.forEach(voto => {
              if (voto.opcao_id) {
                if (!votantesPorOpcao[voto.opcao_id]) {
                  votantesPorOpcao[voto.opcao_id] = [];
                }
                votantesPorOpcao[voto.opcao_id].push({
                  membro_id: voto.membro_id,
                  nome_guerra: membrosMap.get(voto.membro_id) || 'Desconhecido',
                  opcao_id: voto.opcao_id,
                  created_at: voto.created_at
                });
              }
            });

            const opcoesComVotos: OpcaoComVotos[] = (opcoesData || []).map(op => ({
              id: op.id,
              texto: op.texto,
              ordem: op.ordem,
              votos: votosPorOpcao[op.id] || 0,
              percentual: (totalVotos || 0) > 0 ? ((votosPorOpcao[op.id] || 0) / (totalVotos || 1)) * 100 : 0,
              votantes: votantesPorOpcao[op.id] || []
            }));

            return {
              ...enquete,
              total_votos: totalVotos || 0,
              opcoes: opcoesComVotos
            };
          } else {
            // Para texto livre, buscar os textos com informações dos membros
            const votantesTexto: Votante[] = (votosData || [])
              .filter(v => v.texto_livre)
              .map(v => ({
                membro_id: v.membro_id,
                nome_guerra: membrosMap.get(v.membro_id) || 'Desconhecido',
                texto_livre: v.texto_livre || '',
                created_at: v.created_at
              }));

            return {
              ...enquete,
              total_votos: totalVotos || 0,
              votos_texto_livre: votantesTexto.map(v => v.texto_livre || ''),
              votantes: votantesTexto
            };
          }
        })
      );

      setEnquetes(enquetesComStats);
    } catch (error) {
      console.error('Erro ao carregar enquetes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEnquete = (enquete: EnqueteComEstatisticas) => {
    setEditingId(enquete.id);
    setEditingData({
      titulo: enquete.titulo,
      descricao: enquete.descricao || '',
      tipo: enquete.tipo,
      data_encerramento: enquete.data_encerramento.split('T')[0],
      status: enquete.status,
      opcoes: enquete.opcoes || []
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleAddOpcao = () => {
    if (!editingData) return;
    setEditingData({
      ...editingData,
      opcoes: [...editingData.opcoes, { id: Date.now().toString(), texto: '', ordem: editingData.opcoes.length + 1 }]
    });
  };

  const handleRemoveOpcao = (id: string) => {
    if (!editingData || editingData.opcoes.length <= 2) {
      toastWarning('É necessário ter pelo menos 2 opções');
      return;
    }
    setEditingData({
      ...editingData,
      opcoes: editingData.opcoes.filter(op => op.id !== id)
    });
  };

  const handleOpcaoChange = (id: string, texto: string) => {
    if (!editingData) return;
    setEditingData({
      ...editingData,
      opcoes: editingData.opcoes.map(op => op.id === id ? { ...op, texto } : op)
    });
  };

  const handleSave = async () => {
    if (!editingData || !editingId) return;

    // Validações
    if (!editingData.titulo.trim()) {
      toastWarning('O título é obrigatório.');
      return;
    }

    if (!editingData.data_encerramento) {
      toastWarning('A data de encerramento é obrigatória.');
      return;
    }

    if (editingData.tipo === 'multipla_escolha') {
      const opcoesValidas = editingData.opcoes.filter(op => op.texto.trim());
      if (opcoesValidas.length < 2) {
        toastWarning('É necessário ter pelo menos 2 opções válidas.');
        return;
      }
    }

    setSaving(true);
    try {
      // Atualizar enquete
      const { error: enqueteError } = await supabase
        .from('enquetes')
        .update({
          titulo: editingData.titulo.trim(),
          descricao: editingData.descricao.trim() || null,
          tipo: editingData.tipo,
          data_encerramento: new Date(editingData.data_encerramento).toISOString(),
          status: editingData.status
        })
        .eq('id', editingId);

      if (enqueteError) throw enqueteError;

      // Se for múltipla escolha, atualizar opções
      if (editingData.tipo === 'multipla_escolha') {
        // Buscar opções existentes
        const { data: opcoesExistentes } = await supabase
          .from('enquete_opcoes')
          .select('id')
          .eq('enquete_id', editingId);

        // Deletar opções antigas
        if (opcoesExistentes && opcoesExistentes.length > 0) {
          await supabase
            .from('enquete_opcoes')
            .delete()
            .eq('enquete_id', editingId);
        }

        // Inserir novas opções
        const opcoesParaInserir = editingData.opcoes
          .filter(op => op.texto.trim())
          .map((op, index) => ({
            enquete_id: editingId,
            texto: op.texto.trim(),
            ordem: index + 1
          }));

        if (opcoesParaInserir.length > 0) {
          const { error: opcoesError } = await supabase
            .from('enquete_opcoes')
            .insert(opcoesParaInserir);

          if (opcoesError) throw opcoesError;
        }
      }

      toastSuccess('Enquete atualizada com sucesso!');
      await carregarEnquetes();
      handleCancel();
    } catch (error: any) {
      console.error('Erro ao salvar enquete:', error);
      toastError(error.message || 'Erro ao salvar enquete. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (enquete: EnqueteComEstatisticas) => {
    const novoStatus = enquete.status === 'aberta' ? 'encerrada' : 'aberta';
    setShowConfirmToggle(enquete.id);
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const enquetesFiltradas = enquetes.filter(e =>
    e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.descricao && e.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
              Carregando...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/admin" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <BarChart3 className="w-8 h-8 text-brand-red" />
            <h1 className="text-4xl md:text-5xl font-oswald font-bold text-white uppercase">
              Gerenciar Enquetes
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Gerencie e visualize resultados das enquetes
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('aberta')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'aberta' 
                ? 'border-brand-red text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Enquetes Abertas
          </button>
          <button 
            onClick={() => setActiveTab('encerrada')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'encerrada' 
                ? 'border-brand-red text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Enquetes Encerradas
          </button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar enquetes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Formulário de Edição */}
        {editingData && (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-white text-2xl font-oswald uppercase font-bold mb-6">
              Editar Enquete
            </h2>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={editingData.titulo}
                  onChange={(e) => setEditingData({ ...editingData, titulo: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Descrição
                </label>
                <textarea
                  value={editingData.descricao}
                  onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                  rows={3}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red resize-none"
                />
              </div>

              {/* Tipo e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">
                    Tipo *
                  </label>
                  <select
                    value={editingData.tipo}
                    onChange={(e) => setEditingData({ ...editingData, tipo: e.target.value as 'multipla_escolha' | 'texto_livre' })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="texto_livre">Texto Livre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">
                    Data de Encerramento *
                  </label>
                  <input
                    type="datetime-local"
                    value={editingData.data_encerramento}
                    onChange={(e) => setEditingData({ ...editingData, data_encerramento: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Status
                </label>
                <select
                  value={editingData.status}
                  onChange={(e) => setEditingData({ ...editingData, status: e.target.value as 'aberta' | 'encerrada' })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="aberta">Aberta</option>
                  <option value="encerrada">Encerrada</option>
                </select>
              </div>

              {/* Opções (se múltipla escolha) */}
              {editingData.tipo === 'multipla_escolha' && (
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">
                    Opções *
                  </label>
                  <div className="space-y-2">
                    {editingData.opcoes.map((opcao) => (
                      <div key={opcao.id} className="flex gap-2">
                        <input
                          type="text"
                          value={opcao.texto}
                          onChange={(e) => handleOpcaoChange(opcao.id, e.target.value)}
                          placeholder={`Opção ${opcao.ordem}`}
                          className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
                        />
                        {editingData.opcoes.length > 2 && (
                          <button
                            onClick={() => handleRemoveOpcao(opcao.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddOpcao}
                      className="text-brand-red hover:text-red-400 text-sm font-bold flex items-center gap-2"
                    >
                      <span>+</span> Adicionar Opção
                    </button>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Enquetes */}
        <div className="space-y-4">
          {enquetesFiltradas.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'aberta' ? 'Nenhuma enquete aberta' : 'Nenhuma enquete encerrada'}
              </p>
            </div>
          ) : (
            enquetesFiltradas.map((enquete) => (
              <div
                key={enquete.id}
                className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white text-xl font-oswald uppercase font-bold">
                        {enquete.titulo}
                      </h3>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        enquete.status === 'aberta' 
                          ? 'bg-green-950/50 text-green-400' 
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {enquete.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                      </span>
                      <span className="px-3 py-1 rounded text-xs font-bold bg-gray-800 text-gray-400">
                        {enquete.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Texto Livre'}
                      </span>
                    </div>

                    {enquete.descricao && (
                      <p className="text-gray-400 text-sm mb-3">{enquete.descricao}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Encerra em: {formatarData(enquete.data_encerramento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{enquete.total_votos} voto(s)</span>
                      </div>
                    </div>

                    {/* Resultados */}
                    {enquete.total_votos > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        {enquete.tipo === 'multipla_escolha' && enquete.opcoes ? (
                          <div className="space-y-4">
                            {enquete.opcoes.map((opcao) => (
                              <div key={opcao.id} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-300 font-semibold">{opcao.texto}</span>
                                  <span className="text-gray-400">{opcao.votos} votos ({opcao.percentual.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                  <div
                                    className="bg-brand-red h-2 rounded-full transition-all"
                                    style={{ width: `${opcao.percentual}%` }}
                                  />
                                </div>
                                {/* Votantes desta opção */}
                                {opcao.votantes && opcao.votantes.length > 0 && (
                                  <div className="pl-4 border-l-2 border-gray-700">
                                    <button
                                      onClick={() => setEnquetesExpandidas(prev => ({
                                        ...prev,
                                        [`${enquete.id}-${opcao.id}`]: !prev[`${enquete.id}-${opcao.id}`]
                                      }))}
                                      className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold mb-2 transition"
                                    >
                                      {enquetesExpandidas[`${enquete.id}-${opcao.id}`] ? (
                                        <>
                                          <ChevronUp className="w-4 h-4" />
                                          Ocultar votantes
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4" />
                                          Ver quem votou ({opcao.votantes.length})
                                        </>
                                      )}
                                    </button>
                                    {enquetesExpandidas[`${enquete.id}-${opcao.id}`] && (
                                      <div className="space-y-1">
                                        {opcao.votantes.map((votante, idx) => (
                                          <div key={idx} className="text-gray-400 text-xs bg-gray-800/30 p-2 rounded">
                                            {votante.nome_guerra}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-gray-400 text-sm font-bold">Respostas de texto livre:</p>
                              {enquete.votantes && enquete.votantes.length > 0 && (
                                <button
                                  onClick={() => setEnquetesExpandidas(prev => ({
                                    ...prev,
                                    [enquete.id]: !prev[enquete.id]
                                  }))}
                                  className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold transition"
                                >
                                  {enquetesExpandidas[enquete.id] ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Ocultar detalhes
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Ver detalhes
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            {enquete.votos_texto_livre && enquete.votos_texto_livre.length > 0 ? (
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {enquete.votantes && enquetesExpandidas[enquete.id] ? (
                                  // Mostrar com nome do membro
                                  enquete.votantes.map((votante, index) => (
                                    <div key={index} className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded">
                                      <div className="font-semibold text-brand-red mb-1">{votante.nome_guerra}</div>
                                      <div className="text-gray-400">"{votante.texto_livre}"</div>
                                    </div>
                                  ))
                                ) : (
                                  // Mostrar apenas textos
                                  enquete.votos_texto_livre.map((texto, index) => (
                                    <div key={index} className="text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                      "{texto}"
                                    </div>
                                  ))
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Nenhuma resposta ainda</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditEnquete(enquete)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(enquete)}
                      className={`p-2 rounded transition ${
                        enquete.status === 'aberta'
                          ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-950/30'
                          : 'text-green-400 hover:text-green-300 hover:bg-green-950/30'
                      }`}
                      title={enquete.status === 'aberta' ? 'Encerrar' : 'Reabrir'}
                    >
                      {enquete.status === 'aberta' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmação - Alterar Status */}
      {showConfirmToggle && toggleStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-oswald text-xl uppercase font-bold mb-4">
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
                className={`px-4 py-2 rounded transition flex items-center gap-2 ${
                  toggleStatus === 'encerrada'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {toggleStatus === 'encerrada' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    Encerrar
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Reabrir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

