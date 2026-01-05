import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Plus, Edit2, ShieldOff, ArrowLeft, Users, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/DashboardLayout';
import { Cargo, TipoCargoEnum, TIPO_CARGO_STYLES } from '../types/database.types';

interface CargoComEstatisticas extends Cargo {
  membros_count: number;
}

interface EditingCargo {
  nome: string;
  nivel: number;
  tipo_cargo: TipoCargoEnum;
  descricao: string;
  ativo: boolean;
}

export default function ManageCargos() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [cargos, setCargos] = useState<CargoComEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingCargo | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
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
      // Carregar todos os cargos
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('*')
        .order('nivel', { ascending: true });

      if (cargosError) throw cargosError;

      // Para cada cargo, contar quantos integrantes ativos têm esse cargo
      const cargosComStats = await Promise.all(
        (cargosData || []).map(async (cargo: Cargo) => {
          const { count } = await supabase
            .from('membro_cargos')
            .select('*', { count: 'exact', head: true })
            .eq('cargo_id', cargo.id)
            .eq('ativo', true);

          return {
            ...cargo,
            membros_count: count || 0
          };
        })
      );

      setCargos(cargosComStats);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      toastError('Erro ao carregar cargos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setEditingData({
      nome: '',
      nivel: 1,
      tipo_cargo: 'Operacional',
      descricao: '',
      ativo: true
    });
  };

  const handleEdit = (cargo: CargoComEstatisticas) => {
    setIsCreating(false);
    setEditingId(cargo.id);
    setEditingData({
      nome: cargo.nome,
      nivel: cargo.nivel,
      tipo_cargo: cargo.tipo_cargo,
      descricao: cargo.descricao || '',
      ativo: cargo.ativo
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingData) return;

    // Validações
    if (!editingData.nome.trim()) {
      toastWarning('O nome do cargo é obrigatório.');
      return;
    }

    if (editingData.nivel < 1) {
      toastWarning('O nível deve ser maior que zero.');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        // Criar novo cargo
        const { error } = await supabase
          .from('cargos')
          .insert({
            nome: editingData.nome.trim(),
            nivel: editingData.nivel,
            tipo_cargo: editingData.tipo_cargo,
            descricao: editingData.descricao.trim() || null,
            ativo: editingData.ativo
          });

        if (error) throw error;
        toastSuccess('Cargo criado com sucesso!');
      } else if (editingId) {
        // Atualizar cargo existente
        const { error } = await supabase
          .from('cargos')
          .update({
            nome: editingData.nome.trim(),
            nivel: editingData.nivel,
            tipo_cargo: editingData.tipo_cargo,
            descricao: editingData.descricao.trim() || null,
            ativo: editingData.ativo
          })
          .eq('id', editingId);

        if (error) throw error;
        toastSuccess('Cargo atualizado com sucesso!');
      }

      await carregarDados();
      handleCancel();
    } catch (error: any) {
      console.error('Erro ao salvar cargo:', error);
      toastError(error.message || 'Erro ao salvar cargo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (cargo: CargoComEstatisticas) => {
    if (cargo.membros_count > 0 && cargo.ativo) {
      const confirmar = window.confirm(
        `Este cargo está atribuído a ${cargo.membros_count} membro(s). Deseja realmente desativá-lo?`
      );
      if (!confirmar) return;
    }

    try {
      const { error } = await supabase
        .from('cargos')
        .update({ ativo: !cargo.ativo })
        .eq('id', cargo.id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status do cargo:', error);
      toastError('Erro ao alterar status do cargo.');
    }
  };

  if (loading || adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
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
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/admin" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Shield className="w-8 h-8 text-brand-red" />
            <h1 className="text-4xl md:text-5xl font-oswald font-bold text-white uppercase">
              Gerenciar Cargos
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Crie e gerencie os cargos do clube
          </p>
        </div>

        {/* Botão Criar */}
        {!editingData && (
          <div className="mb-6">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Novo Cargo
            </button>
          </div>
        )}

        {/* Formulário de Edição/Criação */}
        {editingData && (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-white text-2xl font-oswald uppercase font-bold mb-6">
              {isCreating ? 'Criar Novo Cargo' : 'Editar Cargo'}
            </h2>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Nome do Cargo *
                </label>
                <input
                  type="text"
                  value={editingData.nome}
                  onChange={(e) => setEditingData({ ...editingData, nome: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                  placeholder="Ex: Presidente, Tesoureiro, etc."
                />
              </div>

              {/* Tipo e Nível */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">
                    Tipo de Cargo *
                  </label>
                  <select
                    value={editingData.tipo_cargo}
                    onChange={(e) => setEditingData({ ...editingData, tipo_cargo: e.target.value as TipoCargoEnum })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Honorario">Honorário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">
                    Nível *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingData.nivel}
                    onChange={(e) => setEditingData({ ...editingData, nivel: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red"
                  />
                  <p className="text-gray-500 text-xs mt-1">Nível hierárquico (1 = mais alto)</p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Descrição
                </label>
                <textarea
                  value={editingData.descricao}
                  onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                  rows={3}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red resize-none"
                  placeholder="Descrição das responsabilidades do cargo..."
                />
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={editingData.ativo}
                  onChange={(e) => setEditingData({ ...editingData, ativo: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-700 bg-black text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="ativo" className="text-gray-400 text-sm">
                  Cargo ativo
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Cargos */}
        <div className="space-y-4">
          {cargos.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-12 text-center">
              <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cargo cadastrado</p>
            </div>
          ) : (
            cargos.map((cargo) => (
              <div
                key={cargo.id}
                className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white text-xl font-oswald uppercase font-bold">
                        {cargo.nome}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          TIPO_CARGO_STYLES[cargo.tipo_cargo]?.bg || 'bg-gray-800'
                        } ${
                          TIPO_CARGO_STYLES[cargo.tipo_cargo]?.text || 'text-gray-400'
                        }`}
                      >
                        {cargo.tipo_cargo}
                      </span>
                      <span className="px-3 py-1 rounded text-xs font-bold bg-gray-800 text-gray-400">
                        Nível {cargo.nivel}
                      </span>
                      {!cargo.ativo && (
                        <span className="px-3 py-1 rounded text-xs font-bold bg-red-950/50 text-red-400">
                          Inativo
                        </span>
                      )}
                    </div>

                    {cargo.descricao && (
                      <p className="text-gray-400 text-sm mb-3">{cargo.descricao}</p>
                    )}

                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{cargo.membros_count} membro(s) com este cargo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cargo)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleAtivo(cargo)}
                      className={`p-2 rounded transition ${
                        cargo.ativo
                          ? 'text-green-400 hover:text-green-300 hover:bg-green-950/30'
                          : 'text-gray-400 hover:text-green-400 hover:bg-green-950/30'
                      }`}
                      title={cargo.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {cargo.ativo ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <ShieldOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

