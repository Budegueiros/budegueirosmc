import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bike, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface MotoData {
  id: string;
  membro_id: string;
  modelo: string;
  marca: string;
  placa: string;
  ano: number;
  ativa: boolean;
}

export default function EditMoto() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moto, setMoto] = useState<MotoData | null>(null);
  const [formData, setFormData] = useState({
    modelo: '',
    marca: '',
    placa: '',
    ano: new Date().getFullYear(),
    ativa: true
  });

  useEffect(() => {
    carregarMoto();
  }, [id]);

  const carregarMoto = async () => {
    if (!user || !id) return;

    try {
      // Buscar membro atual
      const { data: membroData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membroData) {
        navigate('/dashboard');
        return;
      }

      // Buscar moto
      const { data: motoData, error } = await supabase
        .from('motos')
        .select('*')
        .eq('id', id)
        .eq('membro_id', membroData.id)
        .single();

      if (error || !motoData) {
        console.error('Erro ao carregar moto:', error);
        navigate('/dashboard');
        return;
      }

      setMoto(motoData);
      setFormData({
        modelo: motoData.modelo,
        marca: motoData.marca,
        placa: motoData.placa,
        ano: motoData.ano,
        ativa: motoData.ativa
      });
    } catch (error) {
      console.error('Erro ao carregar moto:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!moto) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('motos')
        .update({
          modelo: formData.modelo,
          marca: formData.marca,
          placa: formData.placa.toUpperCase(),
          ano: formData.ano,
          ativa: formData.ativa
        })
        .eq('id', moto.id);

      if (error) throw error;

      toastSuccess('Moto atualizada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao atualizar moto:', error);
      toastError('Erro ao atualizar moto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moto || !confirm('Tem certeza que deseja excluir esta moto?')) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('motos')
        .delete()
        .eq('id', moto.id);

      if (error) throw error;

      toastSuccess('Moto excluída com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao excluir moto:', error);
      toastError('Erro ao excluir moto. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Carregando dados da moto...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao Dashboard</span>
          </button>
          <h1 className="text-white font-oswald text-4xl uppercase font-bold flex items-center gap-3">
            <Bike className="w-8 h-8 text-brand-red" />
            Editar Moto
          </h1>
          <p className="text-gray-400 mt-2">Atualize os dados da sua moto</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-8">
          <div className="space-y-6">
            {/* Marca */}
            <div>
              <label htmlFor="marca" className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Marca *
              </label>
              <input
                type="text"
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                required
                placeholder="Ex: Harley-Davidson, BMW, Yamaha"
              />
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="modelo" className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Modelo *
              </label>
              <input
                type="text"
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                required
                placeholder="Ex: Street Bob, R 1250 GS"
              />
            </div>

            {/* Placa */}
            <div>
              <label htmlFor="placa" className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Placa *
              </label>
              <input
                type="text"
                id="placa"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-brand-red transition"
                required
                maxLength={7}
                placeholder="ABC1D23"
              />
            </div>

            {/* Ano */}
            <div>
              <label htmlFor="ano" className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Ano *
              </label>
              <input
                type="number"
                id="ano"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                required
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Ativa */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ativa"
                checked={formData.ativa}
                onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                className="w-5 h-5 text-brand-red bg-gray-800 border-gray-700 rounded focus:ring-brand-red focus:ring-2"
              />
              <label htmlFor="ativa" className="text-gray-400 text-sm">
                Moto ativa (desmarque se vendeu ou não usa mais)
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-500 font-oswald uppercase font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Excluir Moto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
