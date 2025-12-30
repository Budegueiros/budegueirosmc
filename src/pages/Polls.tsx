import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Plus, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
}

interface Opcao {
  id: string;
  texto: string;
  ordem: number;
  votos: number;
  percentual: number;
}

interface Voto {
  id: string;
  opcao_id: string | null;
  texto_livre: string | null;
}

export default function Polls() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'aberta' | 'encerrada'>('aberta');
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [votando, setVotando] = useState<string | null>(null);
  const [membroId, setMembroId] = useState<string | null>(null);

  // Estado para opções e votos de cada enquete
  const [opcoesPorEnquete, setOpcoesPorEnquete] = useState<Record<string, Opcao[]>>({});
  const [votosPorEnquete, setVotosPorEnquete] = useState<Record<string, Voto | null>>({});
  const [selecaoPorEnquete, setSelecaoPorEnquete] = useState<Record<string, string>>({});
  const [textoLivrePorEnquete, setTextoLivrePorEnquete] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarDados();
  }, [user, activeTab]);

  const carregarDados = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membro
      const { data: membroData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membroData) return;
      setMembroId(membroData.id);

      // Buscar enquetes
      const { data: enquetesData, error: enquetesError } = await supabase
        .from('enquetes')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (enquetesError) throw enquetesError;
      setEnquetes(enquetesData || []);

      // Para cada enquete, buscar opções e votos
      if (enquetesData) {
        const opcoes: Record<string, Opcao[]> = {};
        const votos: Record<string, Voto | null> = {};

        for (const enquete of enquetesData) {
          if (enquete.tipo === 'multipla_escolha') {
            // Buscar opções
            const { data: opcoesData } = await supabase
              .from('enquete_opcoes')
              .select('*')
              .eq('enquete_id', enquete.id)
              .order('ordem');

            // Buscar contagem de votos por opção
            const { data: votosData } = await supabase
              .from('votos')
              .select('opcao_id')
              .eq('enquete_id', enquete.id);

            const totalVotos = votosData?.length || 0;
            const votosPorOpcao = votosData?.reduce((acc, v) => {
              if (v.opcao_id) {
                acc[v.opcao_id] = (acc[v.opcao_id] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>) || {};

            opcoes[enquete.id] = opcoesData?.map(op => ({
              id: op.id,
              texto: op.texto,
              ordem: op.ordem,
              votos: votosPorOpcao[op.id] || 0,
              percentual: totalVotos > 0 ? ((votosPorOpcao[op.id] || 0) / totalVotos) * 100 : 0
            })) || [];
          }

          // Buscar voto do usuário nesta enquete
          const { data: meuVoto } = await supabase
            .from('votos')
            .select('*')
            .eq('enquete_id', enquete.id)
            .eq('membro_id', membroData.id)
            .maybeSingle();

          votos[enquete.id] = meuVoto || null;
        }

        setOpcoesPorEnquete(opcoes);
        setVotosPorEnquete(votos);
      }
    } catch (error) {
      console.error('Erro ao carregar enquetes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVotar = async (enqueteId: string, tipo: 'multipla_escolha' | 'texto_livre') => {
    if (!membroId || votando) return;

    const opcaoSelecionada = selecaoPorEnquete[enqueteId];
    const textoLivre = textoLivrePorEnquete[enqueteId];

    if (tipo === 'multipla_escolha' && !opcaoSelecionada) {
      alert('Por favor, selecione uma opção');
      return;
    }

    if (tipo === 'texto_livre' && !textoLivre?.trim()) {
      alert('Por favor, escreva sua resposta');
      return;
    }

    setVotando(enqueteId);
    try {
      const votoExistente = votosPorEnquete[enqueteId];

      if (votoExistente) {
        // Atualizar voto
        const { error } = await supabase
          .from('votos')
          .update({
            opcao_id: tipo === 'multipla_escolha' ? opcaoSelecionada : null,
            texto_livre: tipo === 'texto_livre' ? textoLivre : null
          })
          .eq('id', votoExistente.id);

        if (error) throw error;
      } else {
        // Inserir novo voto
        const { error } = await supabase
          .from('votos')
          .insert({
            enquete_id: enqueteId,
            membro_id: membroId,
            opcao_id: tipo === 'multipla_escolha' ? opcaoSelecionada : null,
            texto_livre: tipo === 'texto_livre' ? textoLivre : null
          });

        if (error) throw error;
      }

      // Recarregar dados
      await carregarDados();
    } catch (error) {
      console.error('Erro ao votar:', error);
      alert('Erro ao registrar voto. Tente novamente.');
    } finally {
      setVotando(null);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Carregando enquetes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Voltar ao Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-brand-red" />
              <h1 className="text-2xl md:text-4xl font-oswald uppercase font-bold">Enquetes & Votações</h1>
            </div>
          </div>
          {isAdmin && (
            <Link
              to="/create-poll"
              className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-oswald uppercase font-bold text-sm transition flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nova Enquete
            </Link>
          )}
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
          {enquetes.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'aberta' ? 'Nenhuma enquete em aberto' : 'Nenhuma enquete encerrada'}
              </p>
            </div>
          ) : (
            enquetes.map((enquete) => {
              const jaVotou = !!votosPorEnquete[enquete.id];
              const opcoes = opcoesPorEnquete[enquete.id] || [];
              const totalVotos = opcoes.reduce((sum, op) => sum + op.votos, 0);

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
                            <p className="text-white">{votosPorEnquete[enquete.id]?.texto_livre}</p>
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

      {/* Footer */}
      <footer className="text-center text-gray-600 text-sm mt-12">
        © 2025 Budegueiros MC. Todos os direitos reservados.
      </footer>
    </div>
  );
}
