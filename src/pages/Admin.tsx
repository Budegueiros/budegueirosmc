import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, Bike, Shield, Bell, BarChart3, FileText, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';

export default function Admin() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    membrosAtivos: 0,
    eventosFuturos: 0,
    mensalidadesPendentes: 0
  });
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

      // Contar eventos futuros
      const hoje = new Date().toISOString().split('T')[0];
      const { count: eventosCount } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo')
        .gte('data_evento', hoje);

      // Contar mensalidades pendentes (não pagas)
      const { count: mensalidadesCount } = await supabase
        .from('mensalidades')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Pago');

      setStats({
        membrosAtivos: membrosCount || 0,
        eventosFuturos: eventosCount || 0,
        mensalidadesPendentes: mensalidadesCount || 0
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

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-brand-red flex-shrink-0" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white uppercase break-words">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-lg">
            Gerencie integrantes, eventos e mensalidades do clube
          </p>
        </div>

        {/* KPIs - Estatísticas Rápidas no Topo */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-white text-lg md:text-2xl font-oswald uppercase font-bold mb-4 md:mb-6">
            Estatísticas Rápidas
          </h2>
          
          {/* Mobile: Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <div className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-brand-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-2xl font-bold font-oswald mb-0.5">
                  {loadingStats ? '...' : stats.membrosAtivos}
                </div>
                <div className="text-gray-400 text-xs uppercase truncate">Integrantes Ativos</div>
              </div>
            </div>
            
            <div className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-brand-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-2xl font-bold font-oswald mb-0.5">
                  {loadingStats ? '...' : stats.eventosFuturos}
                </div>
                <div className="text-gray-400 text-xs uppercase truncate">Eventos Futuros</div>
              </div>
            </div>
            
            <div className="bg-brand-gray rounded-lg border border-brand-red/50 p-4 flex items-center gap-3 col-span-2">
              <div className="w-10 h-10 bg-brand-red/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-brand-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-brand-red text-2xl font-bold font-oswald mb-0.5">
                  {loadingStats ? '...' : stats.mensalidadesPendentes}
                </div>
                <div className="text-gray-400 text-xs uppercase">Mensalidades Pendentes</div>
              </div>
            </div>
          </div>

          {/* Desktop: Cards Horizontais */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 lg:gap-6">
            {/* KPI: Integrantes Ativos */}
            <div className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                  <Users className="w-6 h-6 text-brand-red" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-white text-3xl lg:text-4xl font-bold font-oswald mb-2">
                {loadingStats ? '...' : stats.membrosAtivos}
              </div>
              <div className="text-gray-400 text-sm uppercase">Integrantes Ativos</div>
            </div>

            {/* KPI: Eventos Futuros */}
            <div className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center group-hover:bg-brand-red/30 transition">
                  <Calendar className="w-6 h-6 text-brand-red" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-white text-3xl lg:text-4xl font-bold font-oswald mb-2">
                {loadingStats ? '...' : stats.eventosFuturos}
              </div>
              <div className="text-gray-400 text-sm uppercase">Eventos Futuros</div>
            </div>

            {/* KPI: Mensalidades Pendentes - Destaque Especial */}
            <div className="bg-brand-gray rounded-lg border-2 border-brand-red/50 p-6 hover:border-brand-red transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-red/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 bg-brand-red/30 rounded-lg flex items-center justify-center group-hover:bg-brand-red/40 transition">
                  <AlertCircle className="w-6 h-6 text-brand-red" />
                </div>
                <AlertCircle className="w-5 h-5 text-brand-red" />
              </div>
              <div className="text-brand-red text-3xl lg:text-4xl font-bold font-oswald mb-2 relative z-10">
                {loadingStats ? '...' : stats.mensalidadesPendentes}
              </div>
              <div className="text-gray-400 text-sm uppercase relative z-10">Mensalidades Pendentes</div>
            </div>
          </div>
        </div>

        {/* Grupos de Ação */}
        <div className="space-y-6 md:space-y-8">
          {/* Grupo Gestão */}
          <div>
            <h3 className="text-white text-base md:text-xl font-oswald uppercase font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-red" />
              Gestão
            </h3>
            
            {/* Mobile: List Tiles */}
            <div className="space-y-2 md:hidden">
              <Link 
                to="/manage-members"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Integrantes
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Visualize e edite informações dos integrantes
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>

              <Link 
                to="/manage-cargos"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Cargos
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Crie e gerencie os cargos do clube
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 lg:gap-6">
              <Link 
                to="/manage-members"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <Users className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Integrantes
                </h4>
                <p className="text-gray-400 text-sm">
                  Visualize e edite informações dos integrantes
                </p>
              </Link>

              <Link 
                to="/manage-cargos"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <Shield className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Cargos
                </h4>
                <p className="text-gray-400 text-sm">
                  Crie e gerencie os cargos do clube
                </p>
              </Link>
            </div>
          </div>

          {/* Grupo Financeiro */}
          <div>
            <h3 className="text-white text-base md:text-xl font-oswald uppercase font-bold mb-4 md:mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-red" />
              Financeiro
            </h3>
            
            {/* Mobile: List Tiles */}
            <div className="space-y-2 md:hidden">
              <Link 
                to="/manage-payments"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Mensalidades
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Controle de pagamentos mensais dos integrantes
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 lg:gap-6">
              <Link 
                to="/manage-payments"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <DollarSign className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Mensalidades
                </h4>
                <p className="text-gray-400 text-sm">
                  Controle de pagamentos mensais dos integrantes
                </p>
              </Link>
            </div>
          </div>

          {/* Grupo Comunicação */}
          <div>
            <h3 className="text-white text-base md:text-xl font-oswald uppercase font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-red" />
              Comunicação
            </h3>
            
            {/* Mobile: List Tiles */}
            <div className="space-y-2 md:hidden">
              <Link 
                to="/manage-events"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bike className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Eventos
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Edite e visualize eventos criados
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>

              <Link 
                to="/manage-comunicados"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Comunicados
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Administre e acompanhe leituras dos comunicados
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>

              <Link 
                to="/manage-documentos"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Documentos
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Administre e acompanhe acessos aos documentos
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>

              <Link 
                to="/manage-polls"
                className="bg-brand-gray rounded-lg border border-gray-800 p-4 flex items-center gap-4 hover:border-brand-red/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-oswald uppercase font-bold mb-0.5">
                    Gerenciar Enquetes
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    Visualize resultados e gerencie enquetes
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Link 
                to="/manage-events"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <Bike className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Eventos
                </h4>
                <p className="text-gray-400 text-sm">
                  Edite e visualize eventos criados
                </p>
              </Link>

              <Link 
                to="/manage-comunicados"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <Bell className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Comunicados
                </h4>
                <p className="text-gray-400 text-sm">
                  Administre e acompanhe leituras dos comunicados
                </p>
              </Link>

              <Link 
                to="/manage-documentos"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <FileText className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Documentos
                </h4>
                <p className="text-gray-400 text-sm">
                  Administre e acompanhe acessos aos documentos
                </p>
              </Link>

              <Link 
                to="/manage-polls"
                className="bg-brand-gray rounded-lg border border-gray-800 p-6 hover:border-brand-red/50 transition-all hover:scale-[1.02] group"
              >
                <div className="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-red/30 transition">
                  <BarChart3 className="w-7 h-7 text-brand-red" />
                </div>
                <h4 className="text-white text-lg font-oswald uppercase font-bold mb-2">
                  Gerenciar Enquetes
                </h4>
                <p className="text-gray-400 text-sm">
                  Visualize resultados e gerencie enquetes
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
