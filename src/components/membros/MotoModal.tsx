import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface MotoData {
  id: string;
  modelo: string;
  marca: string;
  placa: string;
  ano: number;
  ativa: boolean;
}

interface MotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MotoData, 'id'>) => Promise<void>;
  moto?: MotoData | null;
  saving?: boolean;
}

export default function MotoModal({ isOpen, onClose, onSave, moto, saving = false }: MotoModalProps) {
  const [formData, setFormData] = useState({
    modelo: '',
    marca: '',
    placa: '',
    ano: new Date().getFullYear(),
    ativa: true
  });

  useEffect(() => {
    if (moto) {
      setFormData({
        modelo: moto.modelo,
        marca: moto.marca,
        placa: moto.placa,
        ano: moto.ano,
        ativa: moto.ativa
      });
    } else {
      setFormData({
        modelo: '',
        marca: '',
        placa: '',
        ano: new Date().getFullYear(),
        ativa: true
      });
    }
  }, [moto, isOpen]);

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
              {moto ? 'Editar Moto' : 'Adicionar Moto'}
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
                Marca *
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Modelo *
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Placa *
              </label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-[#D32F2F] transition"
                required
                maxLength={7}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                Ano *
              </label>
              <input
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                required
                min={1900}
                max={new Date().getFullYear() + 1}
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ativa"
                checked={formData.ativa}
                onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                className="w-5 h-5 text-[#D32F2F] bg-[#121212] border-gray-700 rounded focus:ring-[#D32F2F] focus:ring-2"
                disabled={saving}
              />
              <label htmlFor="ativa" className="text-gray-400 text-sm">
                Moto ativa
              </label>
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
                    {moto ? 'Atualizar' : 'Adicionar'}
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


