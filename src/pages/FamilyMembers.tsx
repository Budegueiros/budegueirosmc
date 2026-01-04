import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Shield, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';

interface ConjugeData {
  id: string;
  nome_completo: string;
  nome_guerra?: string | null;
  data_nascimento: string;
  created_at: string;
}

interface FilhoData {
  id: string;
  nome_completo: string;
  nome_guerra?: string | null;
  data_nascimento: string;
  created_at: string;
}

export default function FamilyMembers() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [conjuge, setConjuge] = useState<ConjugeData | null>(null);
  const [filhos, setFilhos] = useState<FilhoData[]>([]);
  const [showConjugeForm, setShowConjugeForm] = useState(false);
  const [showFilhoForm, setShowFilhoForm] = useState(false);
  const [editingFilho, setEditingFilho] = useState<FilhoData | null>(null);
  const [saving, setSaving] = useState(false);

  const [conjugeForm, setConjugeForm] = useState({
    nome_completo: '',
    nome_guerra: '',
    data_nascimento: ''
  });

  const [filhoForm, setFilhoForm] = useState({
    nome_completo: '',
    nome_guerra: '',
    data_nascimento: ''
  });

  useEffect(() => {
    carregarDados();
  }, [user]);

  const carregarDados = async () => {
    if (!user) return;

    try {
      // Buscar membro
      const { data: membroData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membroData) {
        navigate('/dashboard');
        return;
      }

      setMembroId(membroData.id);

      // Buscar cônjuge
      const { data: conjugeData } = await supabase
        .from('conjuges')
        .select('*')
        .eq('membro_id', membroData.id)
        .maybeSingle();
      
      setConjuge(conjugeData);

      // Buscar filhos
      const { data: filhosData } = await supabase
        .from('filhos')
        .select('*')
        .eq('membro_id', membroData.id)
        .order('data_nascimento', { ascending: true });
      
      setFilhos(filhosData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConjuge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroId) return;

    setSaving(true);
    try {
      if (conjuge) {
        // Atualizar cônjuge existente
        const { error } = await supabase
          .from('conjuges')
          .update({
            nome_completo: conjugeForm.nome_completo,
            nome_guerra: conjugeForm.nome_guerra || null,
            data_nascimento: conjugeForm.data_nascimento
          })
          .eq('id', conjuge.id);

        if (error) throw error;
      } else {
        // Inserir novo cônjuge
        const { error } = await supabase
          .from('conjuges')
          .insert({
            membro_id: membroId,
            nome_completo: conjugeForm.nome_completo,
            nome_guerra: conjugeForm.nome_guerra || null,
            data_nascimento: conjugeForm.data_nascimento
          });

        if (error) throw error;
      }

      setShowConjugeForm(false);
      setConjugeForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar cônjuge:', error);
      toastError('Erro ao salvar cônjuge. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFilho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroId) return;

    setSaving(true);
    try {
      if (editingFilho) {
        // Atualizar filho existente
        const { error } = await supabase
          .from('filhos')
          .update({
            nome_completo: filhoForm.nome_completo,
            nome_guerra: filhoForm.nome_guerra || null,
            data_nascimento: filhoForm.data_nascimento
          })
          .eq('id', editingFilho.id);

        if (error) throw error;
      } else {
        // Inserir novo filho
        const { error } = await supabase
          .from('filhos')
          .insert({
            membro_id: membroId,
            nome_completo: filhoForm.nome_completo,
            nome_guerra: filhoForm.nome_guerra || null,
            data_nascimento: filhoForm.data_nascimento
          });

        if (error) throw error;
      }
      
      setShowFilhoForm(false);
      setEditingFilho(null);
      setFilhoForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar filho:', error);
      toastError('Erro ao salvar filho. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConjuge = async () => {
    if (!conjuge || !confirm('Tem certeza que deseja remover o cônjuge?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('conjuges')
        .delete()
        .eq('id', conjuge.id);

      if (error) throw error;

      setConjuge(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir cônjuge:', error);
      toastError('Erro ao excluir cônjuge. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFilho = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este filho?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('filhos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir filho:', error);
      toastError('Erro ao excluir filho. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
              Carregando dados...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white font-oswald text-4xl uppercase font-bold flex items-center gap-3">
                  <Users className="w-8 h-8 text-brand-red" />
                  Núcleo Familiar
                </h1>
                <p className="text-gray-400 mt-2">Gerencie os membros da sua família</p>
              </div>
              <span className="bg-yellow-900/30 border border-yellow-600/50 text-yellow-500 px-4 py-2 rounded-lg text-sm font-oswald uppercase flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privado
              </span>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-brand-red" />
                <span>{conjuge ? '1 Cônjuge' : 'Sem Cônjuge'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-red" />
                <span>{filhos.length} {filhos.length === 1 ? 'Filho' : 'Filhos'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cônjuge */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-6 py-4">
              <h2 className="text-white font-oswald text-lg uppercase font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-brand-red" />
                Cônjuge
              </h2>
            </div>

            <div className="p-6">
              {!conjuge && !showConjugeForm && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhum cônjuge cadastrado</p>
                  <button
                    onClick={() => setShowConjugeForm(true)}
                    className="bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-sm py-2 px-6 rounded-lg transition flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Budegueira
                  </button>
                </div>
              )}

              {conjuge && !showConjugeForm && (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 text-xs uppercase mb-1 block">Nome Completo</label>
                    <p className="text-white font-semibold">{conjuge.nome_completo}</p>
                  </div>
                  {conjuge.nome_guerra && (
                    <div>
                      <label className="text-gray-500 text-xs uppercase mb-1 block">Nome de Guerra</label>
                      <p className="text-white font-semibold">{conjuge.nome_guerra}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-500 text-xs uppercase mb-1 block">Data de Nascimento</label>
                    <p className="text-white font-semibold">
                      {new Date(conjuge.data_nascimento).toLocaleDateString('pt-BR')} ({calcularIdade(conjuge.data_nascimento)} anos)
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        setConjugeForm({
                          nome_completo: conjuge.nome_completo,
                          nome_guerra: conjuge.nome_guerra || '',
                          data_nascimento: conjuge.data_nascimento
                        });
                        setShowConjugeForm(true);
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-oswald uppercase font-bold text-xs py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={handleDeleteConjuge}
                      className="flex-1 bg-red-950/30 hover:bg-red-950/50 border border-red-700 text-red-500 font-oswald uppercase font-bold text-xs py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  </div>
                </div>
              )}

              {showConjugeForm && (
                <form onSubmit={handleSaveConjuge} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={conjugeForm.nome_completo}
                      onChange={(e) => setConjugeForm({ ...conjugeForm, nome_completo: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Nome de Guerra
                    </label>
                    <input
                      type="text"
                      value={conjugeForm.nome_guerra}
                      onChange={(e) => setConjugeForm({ ...conjugeForm, nome_guerra: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      value={conjugeForm.data_nascimento}
                      onChange={(e) => setConjugeForm({ ...conjugeForm, data_nascimento: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConjugeForm(false);
                        setConjugeForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Filhos */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-oswald text-lg uppercase font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-red" />
                Filhos ({filhos.length})
              </h2>
              {!showFilhoForm && (
                <button
                  onClick={() => setShowFilhoForm(true)}
                  className="bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-xs py-1.5 px-3 rounded transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </button>
              )}
            </div>

            <div className="p-6">
              {filhos.length === 0 && !showFilhoForm && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhum filho cadastrado</p>
                </div>
              )}

              {filhos.length > 0 && !showFilhoForm && (
                <div className="space-y-3">
                  {filhos.map((filho) => (
                    <div key={filho.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-oswald text-sm uppercase font-bold mb-1">
                            {filho.nome_completo}
                          </h3>
                          {filho.nome_guerra && (
                            <p className="text-gray-300 text-xs font-semibold mb-1">
                              Nome de Guerra: {filho.nome_guerra}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs">
                            {new Date(filho.data_nascimento).toLocaleDateString('pt-BR')} • {calcularIdade(filho.data_nascimento)} anos
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingFilho(filho);
                              setFilhoForm({
                                nome_completo: filho.nome_completo,
                                nome_guerra: filho.nome_guerra || '',
                                data_nascimento: filho.data_nascimento
                              });
                              setShowFilhoForm(true);
                            }}
                            className="text-gray-400 hover:text-brand-red transition p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteFilho(filho.id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showFilhoForm && (
                <form onSubmit={handleSaveFilho} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={filhoForm.nome_completo}
                      onChange={(e) => setFilhoForm({ ...filhoForm, nome_completo: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Nome de Guerra
                    </label>
                    <input
                      type="text"
                      value={filhoForm.nome_guerra}
                      onChange={(e) => setFilhoForm({ ...filhoForm, nome_guerra: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      value={filhoForm.data_nascimento}
                      onChange={(e) => setFilhoForm({ ...filhoForm, data_nascimento: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : editingFilho ? 'Atualizar' : 'Adicionar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFilhoForm(false);
                        setEditingFilho(null);
                        setFilhoForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
