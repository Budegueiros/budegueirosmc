import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface FamiliaData {
  id: string;
  nome_completo: string;
  nome_guerra?: string | null;
  data_nascimento: string;
}

interface FamiliaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FamiliaData, 'id'>) => Promise<void>;
  pessoa?: FamiliaData | null;
  tipo: 'conjuge' | 'filho';
  saving?: boolean;
}

export default function FamiliaModal({ 
  isOpen, 
  onClose, 
  onSave, 
  pessoa, 
  tipo,
  saving = false 
}: FamiliaModalProps) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_guerra: '',
    data_nascimento: ''
  });

  useEffect(() => {
    if (pessoa) {
      setFormData({
        nome_completo: pessoa.nome_completo,
        nome_guerra: pessoa.nome_guerra || '',
        data_nascimento: pessoa.data_nascimento
      });
    } else {
      setFormData({
        nome_completo: '',
        nome_guerra: '',
        data_nascimento: ''
      });
    }
  }, [pessoa, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-xl w-full max-w-md overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#D32F2F]/30 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-white font-oswald text-xl uppercase font-bold">
              {pessoa ? `Editar ${tipo === 'conjuge' ? 'Cônjuge' : 'Filho'}` : `Adicionar ${tipo === 'conjuge' ? 'Cônjuge' : 'Filho'}`}
            </h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-[#B0B0B0] hover:text-white transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Nome de Guerra
              </label>
              <input
                type="text"
                value={formData.nome_guerra}
                onChange={(e) => setFormData({ ...formData, nome_guerra: e.target.value })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                required
                disabled={saving}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#D32F2F] hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {pessoa ? 'Atualizar' : 'Adicionar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


