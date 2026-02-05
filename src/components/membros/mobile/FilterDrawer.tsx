import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  cargos?: Array<{ id: string; nome: string }>;
}

export interface FilterState {
  status: string;
  cargo: string;
  cidade: string;
}

export default function FilterDrawer({
  visible,
  onClose,
  onApply,
  initialFilters,
  cargos = [],
}: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({
      status: 'todos',
      cargo: '',
      cidade: '',
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full bg-gray-800 border-t border-gray-700 rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Status
            </label>
            <div className="space-y-2">
              {[
                { value: 'todos', label: 'Todos' },
                { value: 'brasionado', label: 'Brasionados' },
                { value: 'prospect', label: 'Prospects' },
                { value: 'inativo', label: 'Inativos' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    filters.status === option.value
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-gray-700/50 border border-transparent hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-white font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cargo */}
          {cargos.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Cargo
              </label>
              <select
                value={filters.cargo}
                onChange={(e) =>
                  setFilters({ ...filters, cargo: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos os Cargos</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cidade */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Localização
            </label>
            <input
              type="text"
              value={filters.cidade}
              onChange={(e) =>
                setFilters({ ...filters, cidade: e.target.value })
              }
              placeholder="Buscar por cidade..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-700">
          <button
            onClick={handleClear}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Limpar
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}

