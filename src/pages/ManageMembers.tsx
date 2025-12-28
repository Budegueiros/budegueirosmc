import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Edit2, Shield, ShieldOff, UserPlus, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

interface Membro {
  id: string;
  user_id: string;
  nome_completo: string;
  nome_guerra: string;
  cargo: string;
  numero_carteira: string;
  telefone: string | null;
  email: string;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  ativo: boolean;
  is_admin: boolean;
  created_at: string;
}

interface Cargo {
  id: string;
  nome: string;
  nivel: number;
}

export default function ManageMembers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  
  const [membros, setMembros] = useState<Membro[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCargo, setEditCargo] = useState('');
  const [saving, setSaving] = useState(false);

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
      // Carregar todos os membros
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('*')
        .order('created_at', { ascending: false });

      if (membrosError) throw membrosError;
      setMembros(membrosData || []);

      // Carregar cargos
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('id, nome, nivel')
        .eq('ativo', true)
        .order('nivel', { ascending: true });

      if (cargosError) throw cargosError;
      setCargos(cargosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCargo = (membro: Membro) => {
    setEditingId(membro.id);
    setEditCargo(membro.cargo);
  };

  const handleSaveCargo = async (membroId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('membros')
        .update({ cargo: editCargo })
        .eq('id', membroId);

      if (error) throw error;

      // Atualizar lista local
      setMembros(membros.map(m => 
        m.id === membroId ? { ...m, cargo: editCargo } : m
      ));

      setEditingId(null);
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      alert('Erro ao atualizar cargo');
    } finally {
      setSaving(false);
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
      alert('Erro ao alterar status do membro');
    }
  };

  const handleToggleAdmin = async (membro: Membro) => {
    // Não permitir remover admin de si mesmo
    if (membro.user_id === user?.id && membro.is_admin) {
      alert('Você não pode remover seus próprios privilégios de administrador');
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
      alert('Erro ao alterar privilégios de administrador');
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
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-brand-red" />
                <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
                  Gerenciar Membros
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Gerencie os membros do clube, cargos e permissões
              </p>
            </div>

            <Link
              to="/invite-member"
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Link>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou carteira..."
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Total: {membrosFiltrados.length} {membrosFiltrados.length === 1 ? 'membro' : 'membros'}
          </p>
        </div>

        {/* Lista de Membros */}
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-oswald text-xl uppercase font-bold">
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
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>📧 {membro.email}</span>
                    <span>🎫 {membro.numero_carteira}</span>
                    {membro.telefone && <span>📱 {membro.telefone}</span>}
                    {membro.endereco_cidade && membro.endereco_estado && (
                      <span>📍 {membro.endereco_cidade} - {membro.endereco_estado}</span>
                    )}
                  </div>
                </div>

                {/* Cargo */}
                <div className="md:w-48">
                  {editingId === membro.id ? (
                    <div className="flex gap-2">
                      <select
                        value={editCargo}
                        onChange={(e) => setEditCargo(e.target.value)}
                        className="flex-1 bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      >
                        {cargos.map((cargo) => (
                          <option key={cargo.id} value={cargo.nome}>
                            {cargo.nome}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveCargo(membro.id)}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 bg-gray-800 text-gray-300 px-3 py-2 rounded text-sm font-medium">
                        {membro.cargo}
                      </span>
                      <button
                        onClick={() => handleEditCargo(membro)}
                        className="bg-brand-red/20 hover:bg-brand-red/30 text-brand-red p-2 rounded transition"
                        title="Editar cargo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAdmin(membro)}
                    className={`${
                      membro.is_admin
                        ? 'bg-brand-red/20 hover:bg-brand-red/30 text-brand-red'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } p-2 rounded transition`}
                    title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                  >
                    {membro.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleToggleAtivo(membro)}
                    className={`${
                      membro.ativo
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                    } px-3 py-2 rounded transition text-sm font-oswald uppercase`}
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
