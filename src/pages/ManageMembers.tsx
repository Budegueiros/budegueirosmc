import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Shield, ShieldOff, UserPlus, ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { Membro, STATUS_STYLES } from '../types/database.types';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

export default function ManageMembers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  
  const [membros, setMembros] = useState<MembroWithCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Redirecionar se não for admin
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar todos os membros com seus cargos ativos (LEFT JOIN para incluir membros sem cargos)
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            ativo,
            cargos (
              id,
              nome,
              tipo_cargo
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (membrosError) throw membrosError;
      
      // Transformar dados para incluir apenas cargos ativos
      const membrosTransformados = (membrosData || []).map((m: any) => ({
        ...m,
        cargos_ativos: m.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos) || []
      }));
      
      setMembros(membrosTransformados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleToggleAtivo = async (membro: Membro) => {
    try {
      const { error } = await supabase
        .from('membros')
        .update({ ativo: !membro.ativo })
        .eq('id', membro.id);

      if (error) throw error;

      // Atualizar lista local
      setMembros(membros.map(m => 
        m.id === membro.id ? { ...m, ativo: !m.ativo } : m
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastError('Erro ao alterar status do membro');
    }
  };

  const handleToggleAdmin = async (membro: Membro) => {
    // Não permitir remover admin de si mesmo
    if (membro.user_id === user?.id && membro.is_admin) {
      toastWarning('Você não pode remover seus próprios privilégios de administrador');
      return;
    }

    try {
      const { error } = await supabase
        .from('membros')
        .update({ is_admin: !membro.is_admin })
        .eq('id', membro.id);

      if (error) throw error;

      // Atualizar lista local
      setMembros(membros.map(m => 
        m.id === membro.id ? { ...m, is_admin: !m.is_admin } : m
      ));
    } catch (error) {
      console.error('Erro ao alterar admin:', error);
      toastError('Erro ao alterar privilégios de administrador');
    }
  };

  const membrosFiltrados = membros.filter(m => 
    m.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.numero_carteira.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
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
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-brand-red flex-shrink-0" />
                <h1 className="text-brand-red font-oswald text-2xl sm:text-3xl md:text-4xl uppercase font-bold break-words">
                  Gerenciar Integrantes
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Gerencie os integrantes do clube, cargos e permissões
              </p>
            </div>

            <Link
              to="/invite-member"
              className="flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Link>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar membro por nome, email ou carteira..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Lista de Integrantes */}
        <div className="space-y-4">
          {membrosFiltrados.map((membro) => (
            <div
              key={membro.id}
              className={`bg-brand-gray border ${
                membro.ativo ? 'border-brand-red/30' : 'border-gray-700'
              } rounded-xl p-5 ${!membro.ativo ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-white font-oswald text-xl uppercase font-bold break-words">
                      {membro.nome_guerra}
                    </h3>
                    {membro.is_admin && (
                      <span className="inline-flex items-center gap-1 bg-brand-red/20 border border-brand-red/50 text-brand-red px-2 py-0.5 rounded text-xs font-oswald uppercase">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                    {!membro.ativo && (
                      <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-oswald uppercase">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-2">{membro.nome_completo}</p>
                  
                  {/* Badge de Status */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${STATUS_STYLES[membro.status_membro].bg} ${STATUS_STYLES[membro.status_membro].text}`}>
                      {membro.status_membro}
                    </span>
                    
                    {/* Cargos Ativos */}
                    {membro.cargos_ativos && membro.cargos_ativos.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {membro.cargos_ativos.map((cargo) => (
                          <span
                            key={cargo.id}
                            className="inline-flex px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 whitespace-nowrap"
                            title={cargo.tipo_cargo}
                          >
                            {cargo.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
                    <span className="whitespace-nowrap">📧 {membro.email}</span>
                    <span className="whitespace-nowrap">🎫 {membro.numero_carteira}</span>
                    {membro.data_inicio && (
                      <span className="whitespace-nowrap">📅 {new Date(membro.data_inicio).toLocaleDateString('pt-BR')}</span>
                    )}
                    {membro.telefone && <span className="whitespace-nowrap">📱 {membro.telefone}</span>}
                    {membro.endereco_cidade && membro.endereco_estado && (
                      <span className="whitespace-nowrap">📍 {membro.endereco_cidade} - {membro.endereco_estado}</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <Link
                    to={`/manage-members/${membro.id}`}
                    className="bg-brand-red hover:bg-red-700 text-white p-2 rounded transition flex items-center justify-center sm:justify-start gap-2"
                    title="Gerenciar membro completo"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="sm:hidden text-xs font-oswald uppercase">Gerenciar</span>
                  </Link>
                  
                  <button
                    onClick={() => handleToggleAdmin(membro)}
                    className={`${
                      membro.is_admin
                        ? 'bg-brand-red/20 hover:bg-brand-red/30 text-brand-red'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } p-2 rounded transition flex items-center justify-center sm:justify-start gap-2`}
                    title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                  >
                    {membro.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    <span className="sm:hidden text-xs font-oswald uppercase">{membro.is_admin ? 'Remover Admin' : 'Tornar Admin'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleToggleAtivo(membro)}
                    className={`${
                      membro.ativo
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                    } px-3 py-2 rounded transition text-sm font-oswald uppercase flex items-center justify-center`}
                    title={membro.ativo ? 'Desativar membro' : 'Ativar membro'}
                  >
                    {membro.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {membrosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
