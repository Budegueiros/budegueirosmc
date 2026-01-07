import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { gerarPeriodos } from '../../utils/dateHelpers';

interface FilterBarProps {
  filters: {
    search: string;
    status: string;
    periodo: string;
  };
  setFilters: (filters: { search: string; status: string; periodo: string }) => void;
}

export default function FilterBar({ filters, setFilters }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const periodos = gerarPeriodos();

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const hasActiveFilters = filters.search || filters.status !== 'todos' || filters.periodo;

  const limparFiltros = () => {
    setSearchValue('');
    setFilters({ search: '', status: 'todos', periodo: '' });
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Buscar por nome..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 pl-10 focus:outline-none focus:border-gray-600 transition"
          />
        </div>

        {/* Select de Status */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[150px]"
        >
          <option value="todos">Todos os Status</option>
          <option value="Pago">Pago</option>
          <option value="Aberto">Aberto</option>
          <option value="Pendente">Pendente</option>
          <option value="Atrasado">Atrasado</option>
          <option value="Isento">Isento</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        {/* Select de Período */}
        <select
          value={filters.periodo}
          onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[180px]"
        >
          <option value="">Todos os Períodos</option>
          {periodos.map((periodo) => (
            <option key={periodo.value} value={periodo.value}>
              {periodo.label}
            </option>
          ))}
        </select>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            onClick={limparFiltros}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition px-4 py-2 rounded-md hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
}

