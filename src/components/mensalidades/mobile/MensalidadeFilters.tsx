import { CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';

interface MensalidadeFiltersProps {
  filters: {
    status: string;
    periodo: string;
  };
  counts: {
    pago: number;
    aberto: number;
    atrasado: number;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function MensalidadeFilters({
  filters,
  counts,
  onFilterChange,
}: MensalidadeFiltersProps) {
  const getFilterStyle = (status: string) => {
    const isActive = filters.status === status;
    
    switch (status) {
      case 'pago':
        return {
          base: isActive
            ? 'bg-green-500/20 border-green-500'
            : 'bg-gray-800/50 border-gray-700',
          text: isActive ? 'text-green-400' : 'text-gray-300',
          badge: 'bg-green-500/30',
        };
      case 'aberto':
        return {
          base: isActive
            ? 'bg-yellow-500/20 border-yellow-500'
            : 'bg-gray-800/50 border-gray-700',
          text: isActive ? 'text-yellow-400' : 'text-gray-300',
          badge: 'bg-yellow-500/30',
        };
      case 'atrasado':
        return {
          base: isActive
            ? 'bg-red-500/20 border-red-500'
            : 'bg-gray-800/50 border-gray-700',
          text: isActive ? 'text-red-400' : 'text-gray-300',
          badge: 'bg-red-500/30',
        };
      default:
        return {
          base: isActive
            ? 'bg-blue-500/20 border-blue-500'
            : 'bg-gray-800/50 border-gray-700',
          text: isActive ? 'text-blue-400' : 'text-gray-300',
          badge: 'bg-gray-600/30',
        };
    }
  };

  return (
    <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => onFilterChange('status', 'todos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${
            filters.status === 'todos'
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-gray-800/50 border-gray-700 text-gray-300'
          }`}
        >
          <span className="text-sm font-medium">Todos</span>
        </button>

        <button
          onClick={() => onFilterChange('status', 'Pago')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${getFilterStyle('pago').base}`}
        >
          <CheckCircle2 className={`w-4 h-4 ${getFilterStyle('pago').text}`} />
          <span className={`text-sm font-medium ${getFilterStyle('pago').text}`}>
            Pago
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getFilterStyle('pago').badge}`}
          >
            {counts.pago}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('status', 'Aberto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${getFilterStyle('aberto').base}`}
        >
          <Clock className={`w-4 h-4 ${getFilterStyle('aberto').text}`} />
          <span className={`text-sm font-medium ${getFilterStyle('aberto').text}`}>
            Aberto
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getFilterStyle('aberto').badge}`}
          >
            {counts.aberto}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('status', 'Atrasado')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${getFilterStyle('atrasado').base}`}
        >
          <AlertTriangle className={`w-4 h-4 ${getFilterStyle('atrasado').text}`} />
          <span className={`text-sm font-medium ${getFilterStyle('atrasado').text}`}>
            Atrasado
          </span>
          {counts.atrasado > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getFilterStyle('atrasado').badge}`}
            >
              {counts.atrasado}
            </span>
          )}
        </button>

        {/* Período será tratado separadamente via MonthYearPicker */}
      </div>
    </div>
  );
}

