import { useState, useEffect, useCallback } from 'react';
import { BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { membroService } from '../services/membroService';
import { pollService, EnqueteComOpcoes } from '../services/pollService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/DashboardLayout';
import { handleSupabaseError } from '../utils/errorHandler';

// Tipos importados do pollService
type Opcao = EnqueteComOpcoes['opcoes'][0];
type Voto = EnqueteComOpcoes['meuVoto'] extends null ? never : NonNullable<EnqueteComOpcoes['meuVoto']>;

export default function Polls() {
  const { user } = useAuth();
  const { error: toastError, warning: toastWarning } = useToast();
  const [activeTab, setActiveTab] = useState<'aberta' | 'encerrada'>('aberta');
  const [enquetesComOpcoes, setEnquetesComOpcoes] = useState<EnqueteComOpcoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [votando, setVotando] = useState<string | null>(null);
  const [membroId, setMembroId] = useState<string | null>(null);

  const [selecaoPorEnquete, setSelecaoPorEnquete] = useState<Record<string, string>>({});
  const [textoLivrePorEnquete, setTextoLivrePorEnquete] = useState<Record<string, string>>({});

  const carregarDados = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membro
      const membroData = await membroService.buscarIdPorUserId(user.id);
      if (!membroData) return;
      
      setMembroId(membroData);

      // Buscar enquetes com opções e votos (otimizado - evita N+1)
      const enquetes = await pollService.buscarTodasComOpcoes(membroData, activeTab);
      setEnquetesComOpcoes(enquetes);

      // Inicializar seleções baseado nos votos existentes
      const novasSelecoes: Record<string, string> = {};
      const novosTextosLivres: Record<string, string> = {};
      
      enquetes.forEach((enquete) => {
        if (enquete.meuVoto) {
          if (enquete.meuVoto.opcao_id) {
            novasSelecoes[enquete.id] = enquete.meuVoto.opcao_id;
          }
          if (enquete.meuVoto.texto_livre) {
            novosTextosLivres[enquete.id] = enquete.meuVoto.texto_livre;
          }
        }
      });
      
      setSelecaoPorEnquete(novasSelecoes);
      setTextoLivrePorEnquete(novosTextosLivres);
    } catch (error) {
      const appError = handleSupabaseError(error);
      console.error('Erro ao carregar enquetes:', appError);
      toastError('Erro ao carregar enquetes.');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, toastError]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleVotar = useCallback(async (enqueteId: string, tipo: 'multipla_escolha' | 'texto_livre') => {
    if (!membroId || votando) return;

    const opcaoSelecionada = selecaoPorEnquete[enqueteId];
    const textoLivre = textoLivrePorEnquete[enqueteId];

    if (tipo === 'multipla_escolha' && !opcaoSelecionada) {
      toastWarning('Por favor, selecione uma opção');
      return;
    }

    if (tipo === 'texto_livre' && !textoLivre?.trim()) {
      toastWarning('Por favor, escreva sua resposta');
      return;
    }

    setVotando(enqueteId);
    try {
      await pollService.votar(
        enqueteId,
        membroId,
        tipo,
        opcaoSelecionada || null,
        textoLivre || null
      );

      // Recarregar dados para atualizar estatísticas
      await carregarDados();
    } catch (error) {
      const appError = handleSupabaseError(error);
      console.error('Erro ao votar:', appError);
      toastError('Erro ao registrar voto. Tente novamente.');
    } finally {
      setVotando(null);
    }
  }, [membroId, votando, selecaoPorEnquete, textoLivrePorEnquete, toastWarning, toastError, carregarDados]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando enquetes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-brand-red" />
              <h1 className="text-2xl md:text-4xl font-oswald uppercase font-bold">Enquetes & Votações</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('aberta')}
            className={`pb-3 px-1 font-oswald uppercase text-sm font-bold transition ${
              activeTab === 'aberta'
                ? 'text-white border-b-2 border-brand-red'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Em Aberto
          </button>
          <button
            onClick={() => setActiveTab('encerrada')}
            className={`pb-3 px-1 font-oswald uppercase text-sm font-bold transition ${
              activeTab === 'encerrada'
                ? 'text-white border-b-2 border-brand-red'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Encerradas
          </button>
        </div>

        {/* Lista de Enquetes */}
        <div className="space-y-6">
          {enquetesComOpcoes.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'aberta' ? 'Nenhuma enquete em aberto' : 'Nenhuma enquete encerrada'}
              </p>
            </div>
          ) : (
            enquetesComOpcoes.map((enquete) => {
              const jaVotou = !!enquete.meuVoto;
              const opcoes = enquete.opcoes || [];

              return (
                <div key={enquete.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {/* Header da Enquete */}
                  <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-950/50 text-green-500 px-3 py-1 rounded text-xs font-bold uppercase">
                            {activeTab === 'aberta' ? 'Aberta' : 'Encerrada'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Termina em: {formatarData(enquete.data_encerramento)}
                          </span>
                        </div>
                        <h3 className="text-white font-oswald text-xl uppercase font-bold mb-1">
                          {enquete.titulo}
                        </h3>
                        {enquete.descricao && (
                          <p className="text-gray-400 text-sm">{enquete.descricao}</p>
                        )}
                      </div>
                      {jaVotou && activeTab === 'aberta' && (
                        <CheckCircle className="w-6 h-6 text-brand-red flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Conteúdo da Enquete */}
                  <div className="p-6">
                    {enquete.tipo === 'multipla_escolha' ? (
                      <div className="space-y-4">
                        {jaVotou || activeTab === 'encerrada' ? (
                          // Mostrar resultados
                          <>
                            {opcoes.map((opcao) => (
                              <div key={opcao.id} className="space-y-2">
                                {/* Texto da opção e porcentagem */}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white font-medium">{opcao.texto}</span>
                                  <span className="text-white font-bold">
                                    {Math.round(opcao.percentual)}% ({opcao.votos})
                                  </span>
                                </div>
                                {/* Barra de progresso */}
                                <div className="bg-gray-800 rounded-lg h-8 overflow-hidden relative">
                                  <div
                                    className="bg-gradient-to-r from-red-900 to-red-800 h-full transition-all duration-500 rounded-lg"
                                    style={{ width: `${opcao.percentual}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                            {activeTab === 'aberta' && (
                              <p className="text-center text-brand-red text-sm mt-4 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Votado
                              </p>
                            )}
                          </>
                        ) : (
                          // Mostrar opções para votar
                          <>
                            {opcoes.map((opcao) => (
                              <button
                                key={opcao.id}
                                onClick={() => setSelecaoPorEnquete(prev => ({ ...prev, [enquete.id]: opcao.id }))}
                                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                                  selecaoPorEnquete[enquete.id] === opcao.id
                                    ? 'border-brand-red bg-brand-red/10 text-white'
                                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                                }`}
                              >
                                {opcao.texto}
                              </button>
                            ))}
                            <button
                              onClick={() => handleVotar(enquete.id, 'multipla_escolha')}
                              disabled={!selecaoPorEnquete[enquete.id] || votando === enquete.id}
                              className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-oswald uppercase font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                              {votando === enquete.id ? 'Confirmando...' : 'Confirmar Voto'}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      // Enquete de texto livre
                      <div>
                        {jaVotou || activeTab === 'encerrada' ? (
                          <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-2">Sua resposta:</p>
                            <p className="text-white">{enquete.meuVoto?.texto_livre || ''}</p>
                            {activeTab === 'aberta' && (
                              <p className="text-center text-brand-red text-sm mt-4 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Votado
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={textoLivrePorEnquete[enquete.id] || ''}
                              onChange={(e) => setTextoLivrePorEnquete(prev => ({ ...prev, [enquete.id]: e.target.value }))}
                              placeholder="Digite sua resposta aqui..."
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-red resize-none"
                              rows={4}
                            />
                            <button
                              onClick={() => handleVotar(enquete.id, 'texto_livre')}
                              disabled={!textoLivrePorEnquete[enquete.id]?.trim() || votando === enquete.id}
                              className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-oswald uppercase font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                              {votando === enquete.id ? 'Confirmando...' : 'Confirmar Voto'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
