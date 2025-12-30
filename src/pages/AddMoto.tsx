import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AddMoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [membroId, setMembroId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    modelo: '',
    marca: '',
    placa: '',
    ano: new Date().getFullYear()
  });

  useEffect(() => {
    carregarMembro();
  }, [user]);

  const carregarMembro = async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Erro ao carregar membro:', error);
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!membroId) {
      alert('Erro ao identificar o membro. Tente novamente.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('motos')
        .insert({
          membro_id: membroId,
          modelo: formData.modelo,
          marca: formData.marca,
          placa: formData.placa.toUpperCase(),
          ano: formData.ano,
          ativa: true
        });

      if (error) throw error;

      alert('Moto cadastrada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao cadastrar moto:', error);
      alert('Erro ao cadastrar moto. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
            Cadastrar Nova Moto
          </h1>
          <p className="text-gray-400 mt-2">Adicione uma nova moto ao seu perfil</p>
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
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Moto'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
