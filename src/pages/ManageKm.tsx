import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Bike, Trophy, ChevronDown, ChevronUp, Medal, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/DashboardLayout';

interface ParticipacaoEvento {
  evento_id: string;
  nome: string;
  data_evento: string;
  distancia_km: number | null;
}

interface MembroKm {
  id: string;
  nome_guerra: string;
  nome_completo: string;
  foto_url: string | null;
  total_km: number;
  total_eventos: number;
  participacoes: ParticipacaoEvento[];
}

export default function ManageKm() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [membros, setMembros] = useState<MembroKm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const inicioAno = `${anoSelecionado}-01-01`;
      const fimAno = `${anoSelecionado}-12-31`;

      // Buscar todos os membros ativos
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('id, nome_guerra, nome_completo, foto_url')
        .eq('ativo', true)
        .order('nome_guerra');

      if (membrosError) throw membrosError;

      // Buscar todas as participações com dados do evento no período
      const { data: participacoesData, error: partError } = await supabase
        .from('participacoes_eventos')
        .select(`
          membro_id,
          evento_id,
          eventos!inner (
            nome,
            data_evento,
            distancia_km
          )
        `)
        .gte('eventos.data_evento', inicioAno)
        .lte('eventos.data_evento', fimAno);

      if (partError) throw partError;

      // Montar mapa de participações por membro
      type EventoJoin = { nome: string; data_evento: string; distancia_km: number | null };
      const mapaParticipacoes = new Map<string, ParticipacaoEvento[]>();

      (participacoesData || []).forEach((p: { membro_id: string; evento_id: string; eventos: EventoJoin }) => {
        const evento = p.eventos;
        if (!mapaParticipacoes.has(p.membro_id)) {
          mapaParticipacoes.set(p.membro_id, []);
        }
        mapaParticipacoes.get(p.membro_id)!.push({
          evento_id: p.evento_id,
          nome: evento.nome,
          data_evento: evento.data_evento,
          distancia_km: evento.distancia_km,
        });
      });

      // Montar lista de membros com KM
      const resultado: MembroKm[] = (membrosData || []).map((m) => {
        const participacoes = (mapaParticipacoes.get(m.id) || []).sort(
          (a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()
        );
        const total_km = participacoes.reduce(
          (acc, p) => acc + (typeof p.distancia_km === 'number' && !isNaN(p.distancia_km) ? p.distancia_km : 0),
          0
        );
        return {
          ...m,
          total_km: Math.round(total_km * 100) / 100,
          total_eventos: participacoes.length,
          participacoes,
        };
      });

      // Ordenar por KM (maior primeiro)
      resultado.sort((a, b) => b.total_km - a.total_km);

      setMembros(resultado);
    } catch (error) {
      console.error('Erro ao carregar KM:', error);
      toastError('Erro ao carregar dados de quilometragem');
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado, toastError]);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin, carregarDados]);

  const totalKmClube = membros.reduce((acc, m) => acc + m.total_km, 0);
  const membrosComKm = membros.filter((m) => m.total_km > 0).length;

  const membrosFiltrados = membros.filter(
    (m) =>
      m.nome_guerra.toLowerCase().includes(busca.toLowerCase()) ||
      m.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const medalha = (posicao: number) => {
    if (posicao === 0) return { icon: '🥇', cor: 'text-yellow-400', bg: 'border-yellow-500/40 bg-yellow-950/20' };
    if (posicao === 1) return { icon: '🥈', cor: 'text-gray-300', bg: 'border-gray-400/40 bg-gray-800/30' };
    if (posicao === 2) return { icon: '🥉', cor: 'text-orange-400', bg: 'border-orange-500/40 bg-orange-950/20' };
    return { icon: '', cor: 'text-white', bg: 'border-gray-800 bg-[#111]' };
  };

  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Admin
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <Bike className="w-7 h-7 text-brand-red" />
            <h1 className="text-white font-oswald text-3xl md:text-4xl uppercase font-bold">
              KM Rodados
            </h1>
          </div>
          <p className="text-zinc-400 text-sm">Quilometragem acumulada pelos integrantes nos eventos do clube</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar integrante..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#111] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red placeholder-gray-600"
            />
          </div>

          {/* Seletor de Ano */}
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className="bg-[#111] border border-gray-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        {/* Cards de Resumo */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase font-oswald mb-1">Total do Clube</p>
              <p className="text-white font-bold text-2xl">
                {totalKmClube.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                <span className="text-zinc-500 text-sm font-normal ml-1">km</span>
              </p>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase font-oswald mb-1">Integrantes com KM</p>
              <p className="text-white font-bold text-2xl">
                {membrosComKm}
                <span className="text-zinc-500 text-sm font-normal ml-1">/{membros.length}</span>
              </p>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-zinc-500 text-xs uppercase font-oswald mb-1">Média por Integrante</p>
              <p className="text-white font-bold text-2xl">
                {membrosComKm > 0
                  ? (totalKmClube / membrosComKm).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                  : 0}
                <span className="text-zinc-500 text-sm font-normal ml-1">km</span>
              </p>
            </div>
          </div>
        )}

        {/* Pódio - Top 3 */}
        {!loading && membrosFiltrados.length >= 3 && !busca && (
          <div className="mb-6">
            <h2 className="text-white font-oswald text-lg uppercase font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top Estradeiros {anoSelecionado}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {membrosFiltrados.slice(0, 3).map((m, i) => {
                const { icon, cor, bg } = medalha(i);
                return (
                  <div key={m.id} className={`border rounded-xl p-4 text-center ${bg}`}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 mx-auto mb-2 border-2 border-gray-700">
                      {m.foto_url ? (
                        <img src={m.foto_url} alt={m.nome_guerra} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                          {m.nome_guerra.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className={`font-oswald font-bold uppercase text-sm ${cor}`}>{m.nome_guerra}</p>
                    <p className="text-white font-bold text-lg">
                      {m.total_km.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      <span className="text-zinc-500 text-xs ml-0.5">km</span>
                    </p>
                    <p className="text-zinc-500 text-xs">{m.total_eventos} evento{m.total_eventos !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabela de Ranking */}
        <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Medal className="w-4 h-4 text-brand-red" />
            <h2 className="text-white font-oswald uppercase text-base font-bold">
              Ranking Completo — {anoSelecionado}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          ) : membrosFiltrados.length === 0 ? (
            <div className="py-12 text-center">
              <Bike className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Nenhum integrante encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {membrosFiltrados.map((m, idx) => {
                const posicaoReal = membros.findIndex((mb) => mb.id === m.id);
                const { icon } = medalha(posicaoReal);
                const expandido = expandedId === m.id;

                return (
                  <div key={m.id}>
                    {/* Linha do membro */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                      onClick={() => setExpandedId(expandido ? null : m.id)}
                    >
                      {/* Posição */}
                      <div className="w-8 text-center flex-shrink-0">
                        {icon ? (
                          <span className="text-lg">{icon}</span>
                        ) : (
                          <span className="text-zinc-500 text-sm font-oswald">{posicaoReal + 1}º</span>
                        )}
                      </div>

                      {/* Foto */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt={m.nome_guerra} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
                            {m.nome_guerra.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-oswald uppercase text-sm font-bold truncate">{m.nome_guerra}</p>
                        <p className="text-zinc-500 text-xs truncate">{m.nome_completo}</p>
                      </div>

                      {/* Eventos */}
                      <div className="text-right flex-shrink-0 mr-4 hidden sm:block">
                        <p className="text-zinc-400 text-xs">{m.total_eventos} evento{m.total_eventos !== 1 ? 's' : ''}</p>
                      </div>

                      {/* KM */}
                      <div className="text-right flex-shrink-0 mr-2">
                        <p
                          className={`font-bold text-base ${
                            m.total_km > 0 ? 'text-white' : 'text-zinc-600'
                          }`}
                        >
                          {m.total_km.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          <span className="text-zinc-500 text-xs font-normal ml-0.5">km</span>
                        </p>
                      </div>

                      {/* Expand */}
                      {m.participacoes.length > 0 && (
                        <div className="flex-shrink-0 text-zinc-500">
                          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      )}
                    </button>

                    {/* Detalhe dos eventos */}
                    {expandido && m.participacoes.length > 0 && (
                      <div className="bg-black/30 border-t border-gray-800 px-4 py-3">
                        <p className="text-zinc-500 text-xs uppercase font-oswald mb-2">Eventos participados</p>
                        <div className="space-y-2">
                          {m.participacoes.map((p) => (
                            <div
                              key={p.evento_id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div>
                                <p className="text-white text-sm">{p.nome}</p>
                                <p className="text-zinc-500 text-xs">{formatarData(p.data_evento)}</p>
                              </div>
                              <span className="text-zinc-300 font-bold text-sm flex-shrink-0 ml-4">
                                {p.distancia_km != null
                                  ? `${p.distancia_km.toLocaleString('pt-BR')} km`
                                  : <span className="text-zinc-600 font-normal text-xs">sem dist.</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
