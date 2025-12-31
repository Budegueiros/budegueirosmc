import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, LogOut, Shield, User, DollarSign, Menu, X, BarChart3, Bell } from 'lucide-react';
import { ImProfile } from "react-icons/im";
import { TiMessages } from "react-icons/ti";
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import { StatusMembroEnum, STATUS_STYLES } from '../types/database.types';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MembroData {
  nome_guerra: string;
  status_membro: StatusMembroEnum;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [comunicadosNaoLidos, setComunicadosNaoLidos] = useState(0);
  const [membro, setMembro] = useState<MembroData | null>(null);

  useEffect(() => {
    carregarComunicadosNaoLidos();
    carregarDadosMembro();
  }, []);

  const carregarDadosMembro = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: membroData } = await supabase
        .from('membros')
        .select('nome_guerra, status_membro')
        .eq('user_id', userData.user.id)
        .single();

      if (membroData) {
        setMembro(membroData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do membro:', error);
    }
  };

  const carregarComunicadosNaoLidos = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: membroData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membroData) return;

      const { count } = await supabase
        .from('comunicado_leituras')
        .select('*', { count: 'exact', head: true })
        .eq('membro_id', membroData.id)
        .eq('lido', false);

      setComunicadosNaoLidos(count || 0);
    } catch (error) {
      console.error('Erro ao carregar comunicados não lidos:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER - Fixo no topo, largura total */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-black border-b border-gray-800 z-50 px-8">
        <div className="flex items-center justify-between w-full">
          {/* Logo à esquerda */}
          <div className="flex items-center gap-3 w-64">
            <div className="w-12 h-12 bg-brand-red rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/brasao.jpg" alt="Budegueiros MC" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-white font-rebel text-2xl uppercase font-bold leading-tight">BUDEGUEIROS</h2>
            </div>
          </div>

          {/* Saudação centralizada */}
          <div className="flex-1 text-center">
            <h1 className="text-white font-oswald text-xl uppercase font-bold">
              Bem vindo de volta, {membro?.nome_guerra || 'Irmão'}
            </h1>
          </div>

          {/* Ações à direita */}
          <div className="flex items-center gap-4 w-64 justify-end">
            {/* Notificações */}
            <Link to="/comunicados" className="relative">
              <button className="p-2 text-gray-400 hover:text-white transition">
                <Bell className="w-6 h-6" />
                {comunicadosNaoLidos > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 items-center justify-center text-[10px] font-bold text-white">
                      {comunicadosNaoLidos > 9 ? '9+' : comunicadosNaoLidos}
                    </span>
                  </span>
                )}
              </button>
            </Link>

            {/* Badge de Status */}
            {membro && (
              <div className={`px-4 py-2 rounded-lg text-xs font-oswald uppercase font-bold ${STATUS_STYLES[membro.status_membro]?.bg || 'bg-gray-800'} ${STATUS_STYLES[membro.status_membro]?.text || 'text-gray-400'} border border-gray-700`}>
                Status: {membro.status_membro}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR LATERAL - Desktop, abaixo do header */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-black border-r border-gray-800 fixed left-0 top-20 bottom-0 overflow-y-auto z-40">
        
        {/* Menu de Navegação */}
        <nav className="flex-1 py-6">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/dashboard') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm font-bold transition`}
          >
            <ImProfile className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            to="/family-members" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/family-members') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
          >
            <Users className="w-5 h-5" />
            Minha Família
          </Link>
          <Link 
            to="/my-agenda" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/my-agenda') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
          >
            <Calendar className="w-5 h-5" />
            Agenda
          </Link>
          <Link 
            to="/polls" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/polls') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
          >
            <BarChart3 className="w-5 h-5" />
            Enquetes
          </Link>
          <Link 
            to="/comunicados" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/comunicados') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition relative`}
          >
            <TiMessages className="w-5 h-5" />
            Comunicados
            {comunicadosNaoLidos > 0 && (
              <span className="absolute left-9 top-2 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 items-center justify-center text-[10px] font-bold text-white">
                  {comunicadosNaoLidos > 9 ? '9+' : comunicadosNaoLidos}
                </span>
              </span>
            )}
          </Link>
          <Link 
            to="/my-payments" 
            className={`flex items-center gap-3 px-6 py-3 ${isActive('/my-payments') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
          >
            <DollarSign className="w-5 h-5" />
            Tesouraria
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 px-6 py-3 ${isActive('/admin') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
            >
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link to="/edit-profile" className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition text-sm">
            <User className="w-4 h-4" />
            Configurações
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-brand-red transition text-sm w-full">
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MENU MOBILE - Overlay */}
      {menuMobileAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 lg:hidden" onClick={() => setMenuMobileAberto(false)}>
          <aside className="w-64 bg-black border-r border-gray-800 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Logo */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-red rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/brasao.jpg" alt="Budegueiros MC" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-white font-rebel text-lg uppercase font-bold leading-tight">BUDEGUEIROS</h2>
                  <p className="text-brand-red text-xs font-oswald uppercase tracking-wide">MC EST. 2024</p>
                </div>
              </div>
              <button onClick={() => setMenuMobileAberto(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu de Navegação Mobile */}
            <nav className="flex-1 py-6">
              <Link 
                to="/dashboard" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/dashboard') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm font-bold transition`}
              >
                <Users className="w-5 h-5" />
                Dashboard
              </Link>
              <Link 
                to="/family-members" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/family-members') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
              >
                <Users className="w-5 h-5" />
                Minha Família
              </Link>
              <Link 
                to="/my-agenda" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/my-agenda') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
              >
                <Calendar className="w-5 h-5" />
                Agenda
              </Link>
              <Link 
                to="/polls" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/polls') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
              >
                <BarChart3 className="w-5 h-5" />
                Enquetes
              </Link>
              <Link 
                to="/comunicados" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/comunicados') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition relative`}
              >
                <Bell className="w-5 h-5" />
                Comunicados
                {comunicadosNaoLidos > 0 && (
                  <span className="absolute left-9 top-2 flex h-5 w-5 items-center justify-center">
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 items-center justify-center text-[10px] font-bold text-white">
                      {comunicadosNaoLidos > 9 ? '9+' : comunicadosNaoLidos}
                    </span>
                  </span>
                )}
              </Link>
              <Link 
                to="/my-payments" 
                onClick={() => setMenuMobileAberto(false)} 
                className={`flex items-center gap-3 px-6 py-3 ${isActive('/my-payments') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
              >
                <DollarSign className="w-5 h-5" />
                Tesouraria
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setMenuMobileAberto(false)} 
                  className={`flex items-center gap-3 px-6 py-3 ${isActive('/admin') ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'} font-oswald uppercase text-sm transition`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Footer Sidebar Mobile */}
            <div className="p-4 border-t border-gray-800 space-y-2">
              <Link to="/edit-profile" onClick={() => setMenuMobileAberto(false)} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition text-sm">
                <User className="w-4 h-4" />
                Configurações
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-brand-red transition text-sm w-full">
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-30 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMenuMobileAberto(true)} className="text-brand-red hover:text-red-500 transition">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center overflow-hidden">
            <img src="/brasao.jpg" alt="Budegueiros MC" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white font-rebel text-sm uppercase font-bold">BUDEGUEIROS MC</h2>
        </div>
        <div className="w-6"></div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 lg:ml-64 lg:mt-20 pt-20 lg:pt-6 px-6 pb-6">
        {children}
      </main>
    </div>
  );
}
