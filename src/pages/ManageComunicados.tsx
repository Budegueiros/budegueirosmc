import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Edit2, Trash2, ArrowLeft, Eye, Users, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CreateComunicadoForm from '../components/CreateComunicadoForm';
import { ComunicadoComAutor, ComunicadoPrioridade, ComunicadoTipoDestinatario } from '../types/database.types';

interface ComunicadoComEstatisticas extends ComunicadoComAutor {
  total_destinatarios: number;
  total_lidos: number;
  leituras: Array<{
    membro: {
      nome_guerra: string;
      foto_url: string | null;
    };
    lido_em: string;
  }>;
}

export default function ManageComunicados() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [comunicados, setComunicados] = useState<ComunicadoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
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
          // Buscar leituras com dados do membro
          const { data: leiturasData } = await supabase
            .from('comunicados_leitura')
            .select(`
              lido_em,
              membro:membros (
                nome_guerra,
                foto_url
              )
            `)
            .eq('comunicado_id', comunicado.id);

          // Calcular total de destinatários
          let totalDestinatarios = 0;
          
          if (comunicado.tipo_destinatario === 'geral') {
            const { count } = await supabase
              .from('membros')
              .select('*', { count: 'exact', head: true })
              .eq('ativo', true);
            totalDestinatarios = count || 0;
          } else if (comunicado.tipo_destinatario === 'cargo') {
            const { count } = await supabase
              .from('membro_cargos')
              .select('membro_id', { count: 'exact', head: true })
              .eq('ativo', true)
              .eq('cargos.nome', comunicado.valor_destinatario);
            totalDestinatarios = count || 0;
          } else if (comunicado.tipo_destinatario === 'membro') {
            totalDestinatarios = 1;
          }

          return {
            ...comunicado,
            autor: comunicado.autor || { nome_guerra: 'Desconhecido', foto_url: null },
            ja_lido: false,
            total_destinatarios: totalDestinatarios,
            total_lidos: leiturasData?.length || 0,
            leituras: leiturasData || []
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

  const handleEditar = (comunicado: ComunicadoComEstatisticas) => {
    setEditando(comunicado.id);
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
    if (!confirm('Tem certeza que deseja deletar este comunicado?')) return;

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

  const getPrioridadeIcon = (prioridade: ComunicadoPrioridade) => {
    if (prioridade === 'critica') return <AlertTriangle className="text-red-500" size={20} />;
    if (prioridade === 'alta') return <AlertTriangle className="text-orange-500" size={20} />;
    return <Info className="text-blue-500" size={20} />;
  };

  const getPrioridadeColor = (prioridade: ComunicadoPrioridade) => {
    if (prioridade === 'critica') return 'border-red-600 bg-red-900/10';
    if (prioridade === 'alta') return 'border-orange-500 bg-orange-900/10';
    return 'border-gray-700 bg-zinc-800';
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

  const getPercentualLeitura = (comunicado: ComunicadoComEstatisticas) => {
    if (comunicado.total_destinatarios === 0) return 0;
    return Math.round((comunicado.total_lidos / comunicado.total_destinatarios) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Carregando comunicados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 font-oswald uppercase">
              <Bell className="text-brand-red w-8 h-8" />
              Gerenciar Comunicados
            </h1>
            <p className="text-gray-400 text-sm mt-2">Administre todos os comunicados do clube</p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-oswald uppercase font-bold text-sm transition flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Novo Comunicado
            </button>
          )}
        </div>

        {/* Formulário de Criação */}
        {isCreating && membroId && (
          <CreateComunicadoForm
            membroId={membroId}
            onSuccess={() => {
              setIsCreating(false);
              carregarDados();
            }}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {/* Lista de Comunicados */}
        {!isCreating && (
          <div className="space-y-4">
            {comunicados.length > 0 ? (
              comunicados.map((comunicado) => (
                <div
                  key={comunicado.id}
                  className={`rounded-lg border p-6 transition-all ${getPrioridadeColor(comunicado.prioridade)}`}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getPrioridadeIcon(comunicado.prioridade)}
                      <div className="flex-1">
                        {editando === comunicado.id ? (
                          <input
                            type="text"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            className="w-full bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white font-bold font-oswald uppercase text-lg"
                          />
                        ) : (
                          <h3 className="text-lg font-bold text-white font-oswald uppercase">
                            {comunicado.titulo}
                          </h3>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                          <span>{formatarData(comunicado.created_at)}</span>
                          <span>•</span>
                          <span>Por: {comunicado.autor.nome_guerra}</span>
                          <span>•</span>
                          <span className="uppercase border border-gray-700 px-2 py-0.5 rounded">
                            {comunicado.tipo_destinatario === 'geral'
                              ? 'GERAL'
                              : comunicado.tipo_destinatario === 'cargo'
                              ? `CARGO: ${comunicado.valor_destinatario}`
                              : 'PRIVADO'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editando === comunicado.id ? (
                        <>
                          <button
                            onClick={() => handleSalvarEdicao(comunicado.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition"
                            title="Salvar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            className="p-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditar(comunicado)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletar(comunicado.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {editando === comunicado.id ? (
                    <div className="space-y-4 mb-4">
                      <textarea
                        value={formData.conteudo}
                        onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                        className="w-full bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white min-h-[100px]"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          value={formData.prioridade}
                          onChange={(e) =>
                            setFormData({ ...formData, prioridade: e.target.value as ComunicadoPrioridade })
                          }
                          className="bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white"
                        >
                          <option value="normal">Normal</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                        </select>
                        <select
                          value={formData.tipo_destinatario}
                          onChange={(e) =>
                            setFormData({ ...formData, tipo_destinatario: e.target.value as ComunicadoTipoDestinatario })
                          }
                          className="bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white"
                        >
                          <option value="geral">Geral</option>
                          <option value="cargo">Por Cargo</option>
                          <option value="membro">Integrante Específico</option>
                        </select>
                      </div>
                      {formData.tipo_destinatario !== 'geral' && (
                        <input
                          type="text"
                          value={formData.valor_destinatario}
                          onChange={(e) => setFormData({ ...formData, valor_destinatario: e.target.value })}
                          className="w-full bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white"
                          placeholder={
                            formData.tipo_destinatario === 'cargo' ? 'Nome do Cargo' : 'Nome de Guerra do Membro'
                          }
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap border-t border-gray-700/50 pt-3">
                      {comunicado.conteudo}
                    </p>
                  )}

                  {/* Estatísticas de Leitura */}
                  <div className="border-t border-gray-700/50 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          {comunicado.total_lidos} de {comunicado.total_destinatarios} leram
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            getPercentualLeitura(comunicado) === 100
                              ? 'bg-green-900/30 text-green-500'
                              : getPercentualLeitura(comunicado) >= 50
                              ? 'bg-yellow-900/30 text-yellow-500'
                              : 'bg-red-900/30 text-red-500'
                          }`}
                        >
                          {getPercentualLeitura(comunicado)}%
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandido(expandido === comunicado.id ? null : comunicado.id)}
                        className="text-brand-red hover:text-red-400 text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {expandido === comunicado.id ? 'Ocultar' : 'Ver'} Leituras
                      </button>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-red to-red-700 h-full transition-all"
                        style={{ width: `${getPercentualLeitura(comunicado)}%` }}
                      />
                    </div>

                    {/* Lista de Leituras */}
                    {expandido === comunicado.id && (
                      <div className="mt-4 bg-zinc-900/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-bold text-white mb-3">Integrantes que leram:</h4>
                        {comunicado.leituras.length > 0 ? (
                          <div className="space-y-2">
                            {comunicado.leituras.map((leitura: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                  {leitura.membro?.foto_url ? (
                                    <img src={leitura.membro.foto_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      {leitura.membro?.nome_guerra?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{leitura.membro?.nome_guerra || 'Desconhecido'}</p>
                                  <p className="text-gray-400 text-xs">{formatarData(leitura.lido_em)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Nenhum membro leu este comunicado ainda.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-800/50 rounded border border-dashed border-gray-700">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum comunicado criado ainda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
