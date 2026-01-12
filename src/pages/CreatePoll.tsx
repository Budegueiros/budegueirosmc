import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Opcao {
  id: string;
  texto: string;
}

export default function CreatePoll() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'multipla_escolha' as 'multipla_escolha' | 'texto_livre',
    data_encerramento: ''
  });

  const [opcoes, setOpcoes] = useState<Opcao[]>([
    { id: '1', texto: '' },
    { id: '2', texto: '' }
  ]);

  const handleAddOpcao = () => {
    setOpcoes([...opcoes, { id: Date.now().toString(), texto: '' }]);
  };

  const handleRemoveOpcao = (id: string) => {
    if (opcoes.length <= 2) {
      toastWarning('É necessário ter pelo menos 2 opções');
      return;
    }
    setOpcoes(opcoes.filter(op => op.id !== id));
  };

  const handleOpcaoChange = (id: string, texto: string) => {
    setOpcoes(opcoes.map(op => op.id === id ? { ...op, texto } : op));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validações
    if (!formData.titulo.trim()) {
      toastWarning('Por favor, informe o título da enquete');
      return;
    }

    if (!formData.data_encerramento) {
      toastWarning('Por favor, informe a data de encerramento');
      return;
    }

    if (formData.tipo === 'multipla_escolha') {
      const opcoesValidas = opcoes.filter(op => op.texto.trim());
      if (opcoesValidas.length < 2) {
        toastWarning('É necessário ter pelo menos 2 opções válidas');
        return;
      }
    }

    setSaving(true);
    try {
      // Criar enquete
      const { data: enqueteData, error: enqueteError } = await supabase
        .from('enquetes')
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          tipo: formData.tipo,
          data_encerramento: new Date(formData.data_encerramento).toISOString(),
          status: 'aberta',
          created_by: user.id
        })
        .select()
        .single();

      if (enqueteError) {
        console.error('Erro ao criar enquete:', enqueteError);
        throw enqueteError;
      }

      // Se for múltipla escolha, criar opções
      if (formData.tipo === 'multipla_escolha' && enqueteData) {
        const opcoesParaInserir = opcoes
          .filter(op => op.texto.trim())
          .map((op, index) => ({
            enquete_id: enqueteData.id,
            texto: op.texto.trim(),
            ordem: index + 1
          }));

        const { error: opcoesError } = await supabase
          .from('enquete_opcoes')
          .insert(opcoesParaInserir);

        if (opcoesError) {
          console.error('Erro ao criar opções:', opcoesError);
          throw opcoesError;
        }
      }

      toastSuccess('Enquete criada com sucesso!');
      navigate('/polls');
    } catch (error: any) {
      console.error('Erro detalhado ao criar enquete:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toastError(`Erro ao criar enquete: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/polls')}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Enquetes
          </button>
          <h1 className="text-4xl font-oswald uppercase font-bold text-brand-red">Nova Enquete</h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
              Título da Enquete *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Destino do próximo Moto Fest"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-red transition"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
              Descrição / Detalhes
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Detalhe o objetivo desta votação..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-red transition resize-none"
              rows={3}
            />
          </div>

          {/* Grid: Tipo e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Resposta */}
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Tipo de Resposta
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
              >
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="texto_livre">Texto Livre</option>
              </select>
            </div>

            {/* Data de Encerramento */}
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Data de Encerramento
              </label>
              <input
                type="date"
                value={formData.data_encerramento}
                onChange={(e) => setFormData({ ...formData, data_encerramento: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                required
              />
            </div>
          </div>

          {/* Opções de Resposta (apenas para múltipla escolha) */}
          {formData.tipo === 'multipla_escolha' && (
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-3">
                Opções de Resposta
              </label>
              <div className="space-y-3">
                {opcoes.map((opcao, index) => (
                  <div key={opcao.id} className="flex items-center gap-3">
                    <span className="text-gray-500 font-oswald text-sm w-6">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={opcao.texto}
                      onChange={(e) => handleOpcaoChange(opcao.id, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-red transition"
                    />
                    {opcoes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOpcao(opcao.id)}
                        className="text-gray-500 hover:text-brand-red transition p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOpcao}
                className="mt-3 text-brand-red hover:text-red-400 font-oswald uppercase text-sm font-bold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Opção
              </button>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/polls')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-oswald uppercase font-bold text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-oswald uppercase font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Criando...' : 'Criar Enquete'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-sm mt-12">
        © 2025 Budegueiros MC. Todos os direitos reservados.
      </footer>
    </div>
  );
}
