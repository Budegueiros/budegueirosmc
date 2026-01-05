import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, UserPlus, Users, DollarSign, Bike, Shield, ArrowLeft, Bell, BarChart3, FileText } from 'lucide-react';
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
        <div className="mb-4 md:mb-8">
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

        {/* Grid de Opções - Mobile: Botões Compactos, Desktop: Cards */}
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
          {/* Gerenciar Integrantes */}
          <Link 
            to="/manage-members"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Integrantes
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Visualize e edite informações dos integrantes
              </p>
            </div>
          </Link>

          {/* Gerenciar Mensalidades */}
          <Link 
            to="/manage-payments"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Mensalidades
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Controle de pagamentos mensais dos integrantes
              </p>
            </div>
          </Link>

          {/* Gerenciar Eventos */}
          <Link 
            to="/manage-events"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <Bike className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Eventos
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Edite e visualize eventos criados
              </p>
            </div>
          </Link>

          {/* Gerenciar Comunicados */}
          <Link 
            to="/manage-comunicados"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <Bell className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Comunicados
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Administre e acompanhe leituras dos comunicados
              </p>
            </div>
          </Link>

          {/* Gerenciar Documentos */}
          <Link 
            to="/manage-documentos"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Documentos
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Administre e acompanhe acessos aos documentos
              </p>
            </div>
          </Link>

          {/* Gerenciar Cargos */}
          <Link 
            to="/manage-cargos"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Cargos
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Crie e gerencie os cargos do clube
              </p>
            </div>
          </Link>

          {/* Gerenciar Enquetes */}
          <Link 
            to="/manage-polls"
            className="group flex items-center gap-3 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 hover:border-brand-red/50 p-4 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 transform"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center flex-shrink-0 transition">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-brand-red transition" />
            </div>
            <div className="flex-1 min-w-0 md:text-center">
              <h3 className="text-white text-sm md:text-xl font-oswald uppercase font-bold mb-0 md:mb-2">
                Gerenciar Enquetes
              </h3>
              <p className="text-gray-400 text-xs md:text-sm hidden md:block">
                Visualize resultados e gerencie enquetes
              </p>
            </div>
          </Link>
        </div>

        {/* Seção de Estatísticas */}
        <div className="mt-6 md:mt-12 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-4 md:p-8">
          <h2 className="text-white text-lg md:text-2xl font-oswald uppercase font-bold mb-4 md:mb-6">
            Estatísticas Rápidas
          </h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-6">
            <div className="text-center">
              <div className="text-brand-red text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                {loadingStats ? '...' : stats.membrosAtivos}
              </div>
              <div className="text-gray-400 text-xs md:text-sm uppercase">Integrantes Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-brand-red text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                {loadingStats ? '...' : stats.eventosFuturos}
              </div>
              <div className="text-gray-400 text-xs md:text-sm uppercase">Eventos Futuros</div>
            </div>
            <div className="text-center">
              <div className="text-brand-red text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                {loadingStats ? '...' : stats.mensalidadesPendentes}
              </div>
              <div className="text-gray-400 text-xs md:text-sm uppercase">Mensalidades Pendentes</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
