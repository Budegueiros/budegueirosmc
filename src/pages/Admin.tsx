import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, Bike, Shield, Bell, BarChart3, FileText, ChevronRight, AlertCircle, Wallet, Tag } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';

interface FinancialSummary {
  saldoAtual: number;
  totalEntradas: number;
  totalSaidas: number;
}

interface ProximoEvento {
  nome: string;
  data_evento: string;
}

export default function Admin() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    membrosAtivos: 0,
    eventosFuturos: 0,
    mensalidadesPendentes: 0,
    membrosNovos: 0, // Membros adicionados no último mês
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    saldoAtual: 0,
    totalEntradas: 0,
    totalSaidas: 0,
  });
  const [proximoEvento, setProximoEvento] = useState<ProximoEvento | null>(null);
  const [enquetesAtivas, setEnquetesAtivas] = useState(0);
  const [comunicadosNaoLidos, setComunicadosNaoLidos] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarEstatisticas();
    }
  }, [isAdmin]);

  const carregarEstatisticas = async () => {
    try {
      // Contar membros ativos
      const { count: membrosCount } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Contar membros novos (último mês)
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      const { count: membrosNovosCount } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .gte('created_at', umMesAtras.toISOString());

      // Contar eventos futuros
      const hoje = new Date().toISOString().split('T')[0];
      const { count: eventosCount } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo')
        .gte('data_evento', hoje);

      // Buscar próximo evento
      const { data: proximoEventoData } = await supabase
        .from('eventos')
        .select('nome, data_evento')
        .eq('status', 'Ativo')
        .gte('data_evento', hoje)
        .order('data_evento', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (proximoEventoData) {
        setProximoEvento(proximoEventoData);
      }

      // Contar mensalidades pendentes (não pagas)
      const { count: mensalidadesCount } = await supabase
        .from('mensalidades')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Pago');

      // Buscar resumo financeiro
      const { data: fluxoCaixaData } = await supabase
        .from('fluxo_caixa')
        .select('tipo, valor');

      if (fluxoCaixaData) {
        const totalEntradas = fluxoCaixaData
          .filter(l => l.tipo === 'entrada')
          .reduce((acc, l) => acc + Number(l.valor), 0);
        
        const totalSaidas = fluxoCaixaData
          .filter(l => l.tipo === 'saida')
          .reduce((acc, l) => acc + Number(l.valor), 0);

        setFinancialSummary({
          saldoAtual: totalEntradas - totalSaidas,
          totalEntradas,
          totalSaidas,
        });
      }

      // Contar enquetes ativas
      const { count: enquetesCount } = await supabase
        .from('enquetes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativa');

      setEnquetesAtivas(enquetesCount || 0);

      // Contar comunicados não lidos (buscar todos os comunicados e verificar leituras)
      const { data: comunicadosData } = await supabase
        .from('comunicados')
        .select('id')
        .order('created_at', { ascending: false });

      if (comunicadosData && comunicadosData.length > 0) {
        // Buscar leituras de todos os membros para calcular não lidos
        const { data: leiturasData } = await supabase
          .from('comunicados_leitura')
          .select('comunicado_id');

        const idsLidos = new Set(leiturasData?.map(l => l.comunicado_id) || []);
        const naoLidos = comunicadosData.filter(c => !idsLidos.has(c.id));
        setComunicadosNaoLidos(naoLidos.length);
      }

      setStats({
        membrosAtivos: membrosCount || 0,
        eventosFuturos: eventosCount || 0,
        mensalidadesPendentes: mensalidadesCount || 0,
        membrosNovos: membrosNovosCount || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-12 h-12 text-brand-red animate-pulse mx-auto mb-4" />
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

  const formatarData = (dataString: string) => {
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-brand-red flex-shrink-0" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white uppercase break-words">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base">
            Gerencie integrantes, eventos e mensalidades do clube
          </p>
        </div>

        {/* KPIs - Estatísticas Rápidas no Topo */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-white text-lg md:text-xl font-oswald uppercase font-bold mb-4">
            Estatísticas Rápidas
          </h2>
          
          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            <StatCard
              label="Integrantes Ativos"
              value={stats.membrosAtivos}
              icon={Users}
              trend={stats.membrosNovos > 0 ? {
                value: stats.membrosNovos,
                label: 'novos no último mês',
                positive: true
              } : undefined}
              loading={loadingStats}
            />
            
            <StatCard
              label="Eventos Futuros"
              value={stats.eventosFuturos}
              icon={Calendar}
              loading={loadingStats}
            />
            
            <StatCard
              label="Mensalidades Pendentes"
              value={stats.mensalidadesPendentes}
              icon={AlertCircle}
              alert={stats.mensalidadesPendentes > 0}
              loading={loadingStats}
            />
          </div>
        </div>

        {/* Grupos de Ação */}
        <div className="space-y-5 md:space-y-6">
          {/* Grupo Gestão */}
          <div>
            <h3 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-3 md:mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-red" />
              Gestão
            </h3>
            
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Link 
                to="/manage-members"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Users className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Integrantes
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Visualize e edite informações dos integrantes
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/manage-cargos"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Shield className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Cargos
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Crie e gerencie os cargos do clube
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Grupo Financeiro */}
          <div>
            <h3 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-3 md:mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-red" />
              Financeiro
            </h3>
            
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Link 
                to="/manage-payments"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <DollarSign className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Mensalidades
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Controle de pagamentos mensais dos integrantes
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/controle-caixa"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Wallet className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Controle de Caixa
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Gerencie entradas e saídas do caixa do clube
                </p>
                {financialSummary.saldoAtual !== 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-zinc-500 uppercase mb-0.5">Saldo Atual</div>
                    <div className={`text-sm font-bold ${financialSummary.saldoAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatarMoeda(financialSummary.saldoAtual)}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/manage-categorias-caixa"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Tag className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Categorias do Caixa
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Gerencie categorias de entradas e saídas
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Grupo Comunicação */}
          <div>
            <h3 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-3 md:mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-red" />
              Comunicação
            </h3>
            
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Link 
                to="/manage-events"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Bike className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Eventos
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Edite e visualize eventos criados
                </p>
                {proximoEvento && (
                  <div className="mb-2">
                    <div className="text-xs text-zinc-500 uppercase mb-0.5">Próximo Evento</div>
                    <div className="text-sm font-semibold text-white truncate">{proximoEvento.nome}</div>
                    <div className="text-xs text-zinc-500">{formatarData(proximoEvento.data_evento)}</div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/manage-comunicados"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group relative"
              >
                {comunicadosNaoLidos > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {comunicadosNaoLidos > 9 ? '9+' : comunicadosNaoLidos}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <Bell className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Comunicados
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Administre e acompanhe leituras dos comunicados
                </p>
                {comunicadosNaoLidos > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-red-400 font-semibold">
                      {comunicadosNaoLidos} não lido{comunicadosNaoLidos > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/manage-documentos"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <FileText className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Documentos
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Administre e acompanhe acessos aos documentos
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>

              <Link 
                to="/manage-polls"
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 md:p-5 hover:border-brand-red/50 hover:bg-[#161616] transition-all duration-200 group relative"
              >
                {enquetesAtivas > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                      {enquetesAtivas > 9 ? '9+' : enquetesAtivas}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                    <BarChart3 className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <h4 className="text-white text-base md:text-lg font-oswald uppercase font-bold mb-1.5">
                  Gerenciar Enquetes
                </h4>
                <p className="text-zinc-400 text-xs md:text-sm mb-2">
                  Visualize resultados e gerencie enquetes
                </p>
                {enquetesAtivas > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-green-400 font-semibold">
                      {enquetesAtivas} ativa{enquetesAtivas > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <ChevronRight className="w-4 h-4 group-hover:text-brand-red transition" />
                  <span className="group-hover:text-zinc-400 transition">Acessar</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
