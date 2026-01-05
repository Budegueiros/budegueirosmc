import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, Eye, Users, X, CheckCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CreateDocumentoForm from '../components/CreateDocumentoForm';
import { DocumentoComAutor, DocumentoTipoDestinatario } from '../types/database.types';

interface DocumentoComEstatisticas extends DocumentoComAutor {
  total_destinatarios: number;
  total_acessos: number;
  acessos: Array<{
    membro: {
      nome_guerra: string;
      foto_url: string | null;
    };
    acessado_em: string;
  }>;
}

export default function ManageDocumentos() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
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
          // Buscar acessos com dados do membro
          const { data: acessosData } = await supabase
            .from('documentos_acesso')
            .select(`
              acessado_em,
              membro:membros (
                nome_guerra,
                foto_url
              )
            `)
            .eq('documento_id', documento.id);

          // Calcular total de destinatários
          let totalDestinatarios = 0;
          
          if (documento.tipo_destinatario === 'geral') {
            const { count } = await supabase
              .from('membros')
              .select('*', { count: 'exact', head: true })
              .eq('ativo', true);
            totalDestinatarios = count || 0;
          } else if (documento.tipo_destinatario === 'cargo') {
            const { count } = await supabase
              .from('membro_cargos')
              .select('membro_id', { count: 'exact', head: true })
              .eq('ativo', true);
            totalDestinatarios = count || 0;
          } else if (documento.tipo_destinatario === 'membro') {
            totalDestinatarios = 1;
          }

          return {
            ...documento,
            autor: documento.autor || { nome_guerra: 'Desconhecido', foto_url: null },
            ja_acessado: false,
            total_destinatarios: totalDestinatarios,
            total_acessos: acessosData?.length || 0,
            acessos: acessosData || []
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

  const handleEditar = (documento: DocumentoComEstatisticas) => {
    setEditando(documento.id);
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
    if (!confirm('Tem certeza que deseja deletar este documento?')) return;

    try {
      // Buscar o documento para pegar a URL do arquivo
      const { data: documento } = await supabase
        .from('documentos')
        .select('arquivo_url')
        .eq('id', documentoId)
        .single();

      // Deletar do banco (isso vai deletar os acessos também por causa do CASCADE)
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;

      // Tentar deletar o arquivo do storage (opcional, não bloqueia se falhar)
      if (documento?.arquivo_url) {
        try {
          // Extrair o nome do arquivo da URL
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPercentualAcesso = (documento: DocumentoComEstatisticas) => {
    if (documento.total_destinatarios === 0) return 0;
    return Math.round((documento.total_acessos / documento.total_destinatarios) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Carregando documentos...</p>
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
              <FileText className="text-brand-red w-8 h-8" />
              Gerenciar Documentos
            </h1>
            <p className="text-gray-400 text-sm mt-2">Administre todos os documentos do clube</p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-oswald uppercase font-bold text-sm transition flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Novo Documento
            </button>
          )}
        </div>

        {/* Formulário de Criação */}
        {isCreating && membroId && (
          <CreateDocumentoForm
            membroId={membroId}
            onSuccess={() => {
              setIsCreating(false);
              carregarDados();
            }}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {/* Lista de Documentos */}
        {!isCreating && (
          <div className="space-y-4">
            {documentos.length > 0 ? (
              documentos.map((documento) => (
                <div
                  key={documento.id}
                  className="rounded-lg border border-gray-700 bg-zinc-800 p-6 transition-all"
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="text-brand-red" size={24} />
                      <div className="flex-1">
                        {editando === documento.id ? (
                          <input
                            type="text"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            className="w-full bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white font-bold font-oswald uppercase text-lg"
                          />
                        ) : (
                          <h3 className="text-lg font-bold text-white font-oswald uppercase">
                            {documento.titulo}
                          </h3>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                          <span>{formatarData(documento.created_at)}</span>
                          <span>•</span>
                          <span>Por: {documento.autor.nome_guerra}</span>
                          <span>•</span>
                          <span className="uppercase border border-gray-700 px-2 py-0.5 rounded">
                            {documento.tipo_destinatario === 'geral'
                              ? 'GERAL'
                              : documento.tipo_destinatario === 'cargo'
                              ? `CARGO: ${documento.valor_destinatario}`
                              : 'PRIVADO'}
                          </span>
                          {documento.tipo_arquivo && (
                            <>
                              <span>•</span>
                              <span className="uppercase">{documento.tipo_arquivo}</span>
                            </>
                          )}
                          {documento.tamanho_bytes && (
                            <>
                              <span>•</span>
                              <span>{formatarTamanho(documento.tamanho_bytes)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={documento.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {editando === documento.id ? (
                        <>
                          <button
                            onClick={() => handleSalvarEdicao(documento.id)}
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
                            onClick={() => handleEditar(documento)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletar(documento.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  {editando === documento.id ? (
                    <div className="space-y-4 mb-4">
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        className="w-full bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white min-h-[100px]"
                        placeholder="Descrição do documento..."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          value={formData.tipo_destinatario}
                          onChange={(e) =>
                            setFormData({ ...formData, tipo_destinatario: e.target.value as DocumentoTipoDestinatario })
                          }
                          className="bg-zinc-900 border border-gray-700 rounded px-3 py-2 text-white"
                        >
                          <option value="geral">Geral</option>
                          <option value="cargo">Por Cargo</option>
                          <option value="membro">Membro Específico</option>
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
                    documento.descricao && (
                      <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap border-t border-gray-700/50 pt-3">
                        {documento.descricao}
                      </p>
                    )
                  )}

                  {/* Estatísticas de Acesso */}
                  <div className="border-t border-gray-700/50 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          {documento.total_acessos} de {documento.total_destinatarios} acessaram
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            getPercentualAcesso(documento) === 100
                              ? 'bg-green-900/30 text-green-500'
                              : getPercentualAcesso(documento) >= 50
                              ? 'bg-yellow-900/30 text-yellow-500'
                              : 'bg-red-900/30 text-red-500'
                          }`}
                        >
                          {getPercentualAcesso(documento)}%
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandido(expandido === documento.id ? null : documento.id)}
                        className="text-brand-red hover:text-red-400 text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {expandido === documento.id ? 'Ocultar' : 'Ver'} Acessos
                      </button>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-red to-red-700 h-full transition-all"
                        style={{ width: `${getPercentualAcesso(documento)}%` }}
                      />
                    </div>

                    {/* Lista de Acessos */}
                    {expandido === documento.id && (
                      <div className="mt-4 bg-zinc-900/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-bold text-white mb-3">Integrantes que acessaram:</h4>
                        {documento.acessos.length > 0 ? (
                          <div className="space-y-2">
                            {documento.acessos.map((acesso: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                  {acesso.membro?.foto_url ? (
                                    <img src={acesso.membro.foto_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      {acesso.membro?.nome_guerra?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{acesso.membro?.nome_guerra || 'Desconhecido'}</p>
                                  <p className="text-gray-400 text-xs">{formatarData(acesso.acessado_em)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Nenhum membro acessou este documento ainda.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-800/50 rounded border border-dashed border-gray-700">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento criado ainda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

