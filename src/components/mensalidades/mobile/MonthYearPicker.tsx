import { X, Check } from 'lucide-react';
import { gerarPeriodos } from '../../../utils/dateHelpers';

interface MonthYearPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (periodo: string) => void;
  initialPeriodo?: string;
}

export default function MonthYearPicker({
  visible,
  onClose,
  onSelect,
  initialPeriodo,
}: MonthYearPickerProps) {
  if (!visible) return null;

  const periodos = gerarPeriodos();
  const periodoAtual = initialPeriodo || periodos[0].value;

  const handleSelect = (periodo: string) => {
    onSelect(periodo);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Picker */}
      <div className="absolute inset-x-0 bottom-0 bg-gray-800 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Selecionar Período</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Periods List */}
        <div className="px-4 py-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            {periodos.map((periodo) => (
              <button
                key={periodo.value}
                onClick={() => handleSelect(periodo.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition ${
                  periodoAtual === periodo.value
                    ? 'bg-blue-500/20 border border-blue-500'
                    : 'bg-gray-700/30 hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <span
                  className={`text-base font-medium ${
                    periodoAtual === periodo.value
                      ? 'text-blue-400'
                      : 'text-white'
                  }`}
                >
                  {periodo.label}
                </span>
                {periodoAtual === periodo.value && (
                  <Check className="w-5 h-5 text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <div className="px-4 pb-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition"
          >
            <span className="text-white font-semibold">Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

