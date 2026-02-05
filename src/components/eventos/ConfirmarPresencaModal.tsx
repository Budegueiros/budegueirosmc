import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ConfirmarPresencaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (detalhes: { vaiComBudegueira: boolean; quantidadeVisitantes: number }) => void;
  confirmando?: boolean;
}

export default function ConfirmarPresencaModal({
  isOpen,
  onClose,
  onConfirm,
  confirmando = false,
}: ConfirmarPresencaModalProps) {
  const [vaiComBudegueira, setVaiComBudegueira] = useState(false);
  const [quantidadeVisitantes, setQuantidadeVisitantes] = useState('0');

  useEffect(() => {
    if (isOpen) {
      setVaiComBudegueira(false);
      setQuantidadeVisitantes('0');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const visitantesNumber = Math.max(0, parseInt(quantidadeVisitantes || '0', 10) || 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-xl font-bold">Confirmar Presença</h3>
            <p className="text-gray-400 text-sm">
              Informe como será sua participação no rolê
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={confirmando}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-xs uppercase mb-2">Você vai</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setVaiComBudegueira(false)}
                disabled={confirmando}
                className={`px-4 py-2 rounded border text-sm font-semibold transition ${
                  !vaiComBudegueira
                    ? 'bg-green-600/20 border-green-600 text-green-400'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                Sozinho
              </button>
              <button
                onClick={() => setVaiComBudegueira(true)}
                disabled={confirmando}
                className={`px-4 py-2 rounded border text-sm font-semibold transition ${
                  vaiComBudegueira
                    ? 'bg-green-600/20 border-green-600 text-green-400'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                Com a Budegueira
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase mb-1">Visitantes</label>
            <input
              type="number"
              min={0}
              value={quantidadeVisitantes}
              onChange={(e) => setQuantidadeVisitantes(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
              disabled={confirmando}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={confirmando}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ vaiComBudegueira, quantidadeVisitantes: visitantesNumber })}
            disabled={confirmando}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
