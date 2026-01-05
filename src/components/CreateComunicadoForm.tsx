import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { ComunicadoPrioridade, ComunicadoTipoDestinatario } from '../types/database.types';

interface CreateComunicadoFormProps {
  membroId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateComunicadoForm({ membroId, onSuccess, onCancel }: CreateComunicadoFormProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [prioridade, setPrioridade] = useState<ComunicadoPrioridade>('normal');
  const [tipoDestinatario, setTipoDestinatario] = useState<ComunicadoTipoDestinatario>('geral');
  const [valorDestinatario, setValorDestinatario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('comunicados').insert({
        titulo,
        conteudo,
        prioridade,
        tipo_destinatario: tipoDestinatario,
        valor_destinatario: tipoDestinatario === 'geral' ? null : valorDestinatario,
        membro_id_autor: membroId
      });

      if (error) throw error;

      toastSuccess('Comunicado publicado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar comunicado:', error);
      toastError('Erro ao publicar comunicado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-lg border border-gray-700 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white font-oswald uppercase">Novo Comunicado</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Título */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Título / Assunto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
            placeholder="Ex: Reunião Geral Extraordinária"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prioridade <span className="text-red-500">*</span>
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as ComunicadoPrioridade)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
            >
              <option value="normal">Normal (Informativo)</option>
              <option value="alta">Alta (Importante)</option>
              <option value="critica">Crítica (Urgente)</option>
            </select>
          </div>

          {/* Destinatário */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destinatário <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoDestinatario}
              onChange={(e) => setTipoDestinatario(e.target.value as ComunicadoTipoDestinatario)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
            >
              <option value="geral">Geral (Todos os Integrantes)</option>
              <option value="cargo">Por Cargo/Função</option>
              <option value="integrante">Integrante Específico (Privado)</option>
            </select>
          </div>
        </div>

        {/* Campo condicional para cargo */}
        {tipoDestinatario === 'cargo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecione o Cargo <span className="text-red-500">*</span>
            </label>
            <select
              value={valorDestinatario}
              onChange={(e) => setValorDestinatario(e.target.value)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
              required
            >
              <option value="">Selecione...</option>
              <option value="Presidente">Presidente</option>
              <option value="Vice-Presidente">Vice-Presidente</option>
              <option value="Road Captain">Road Captain</option>
              <option value="Tesoureiro">Tesoureiro</option>
              <option value="Secretário">Secretário</option>
              <option value="Sargento de Armas">Sargento de Armas</option>
            </select>
          </div>
        )}

        {/* Campo condicional para integrante específico */}
        {tipoDestinatario === 'integrante' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome de Guerra do Integrante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={valorDestinatario}
              onChange={(e) => setValorDestinatario(e.target.value)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
              placeholder="Digite o Nome de Guerra"
              required
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Conteúdo da Mensagem <span className="text-red-500">*</span>
          </label>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red min-h-[150px]"
            placeholder="Digite aqui o comunicado completo..."
            required
            rows={5}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded shadow-lg transition disabled:opacity-50 font-oswald uppercase"
          >
            {loading ? 'Publicando...' : 'Publicar Comunicado'}
          </button>
        </div>
      </form>
    </div>
  );
}
