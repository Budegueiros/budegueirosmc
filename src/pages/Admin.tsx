import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, UserPlus, Users, DollarSign, Bike, User, Shield, ArrowLeft, Bell } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';

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
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-brand-red animate-pulse mx-auto mb-4" />
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
    <div className="min-h-screen bg-black pt-20 pb-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-brand-red" />
            <h1 className="text-4xl md:text-5xl font-oswald font-bold text-white uppercase">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Gerencie membros, eventos e mensalidades do clube
          </p>
        </div>

        {/* Grid de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Convidar Membro */}
          <Link 
            to="/invite-member"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <UserPlus className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Convidar Membro
              </h3>
              <p className="text-gray-400 text-sm">
                Envie convites para novos membros se juntarem ao clube
              </p>
            </div>
          </Link>

          {/* Criar Evento */}
          <Link 
            to="/create-event"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <Calendar className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Criar Evento
              </h3>
              <p className="text-gray-400 text-sm">
                Organize novos rolês e eventos para os membros
              </p>
            </div>
          </Link>

          {/* Gerenciar Membros */}
          <Link 
            to="/manage-members"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <Users className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Gerenciar Membros
              </h3>
              <p className="text-gray-400 text-sm">
                Visualize e edite informações dos membros
              </p>
            </div>
          </Link>

          {/* Gerenciar Mensalidades */}
          <Link 
            to="/manage-payments"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <DollarSign className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Gerenciar Mensalidades
              </h3>
              <p className="text-gray-400 text-sm">
                Controle de pagamentos mensais dos membros
              </p>
            </div>
          </Link>

          {/* Gerenciar Eventos */}
          <Link 
            to="/manage-events"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <Bike className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Gerenciar Eventos
              </h3>
              <p className="text-gray-400 text-sm">
                Edite e visualize eventos criados
              </p>
            </div>
          </Link>

          {/* Gerenciar Comunicados */}
          <Link 
            to="/manage-comunicados"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <Bell className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Gerenciar Comunicados
              </h3>
              <p className="text-gray-400 text-sm">
                Administre e acompanhe leituras dos comunicados
              </p>
            </div>
          </Link>

          {/* Configurações */}
          <Link 
            to="/edit-profile"
            className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-brand-red/50 p-8 transition-all hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-800/50 group-hover:bg-brand-red/20 rounded-full flex items-center justify-center mb-4 transition">
                <User className="w-8 h-8 text-gray-400 group-hover:text-brand-red transition" />
              </div>
              <h3 className="text-white text-xl font-oswald uppercase font-bold mb-2">
                Configurações
              </h3>
              <p className="text-gray-400 text-sm">
                Ajuste suas preferências e perfil
              </p>
            </div>
          </Link>
        </div>

        {/* Seção de Estatísticas (futuro) */}
        <div className="mt-12 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-8">
          <h2 className="text-white text-2xl font-oswald uppercase font-bold mb-6">
            Estatísticas Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-brand-red text-4xl font-bold mb-2">
                {loadingStats ? '...' : stats.membrosAtivos}
              </div>
              <div className="text-gray-400 text-sm uppercase">Membros Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-brand-red text-4xl font-bold mb-2">
                {loadingStats ? '...' : stats.eventosFuturos}
              </div>
              <div className="text-gray-400 text-sm uppercase">Eventos Futuros</div>
            </div>
            <div className="text-center">
              <div className="text-brand-red text-4xl font-bold mb-2">
                {loadingStats ? '...' : stats.mensalidadesPendentes}
              </div>
              <div className="text-gray-400 text-sm uppercase">Mensalidades Pendentes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
