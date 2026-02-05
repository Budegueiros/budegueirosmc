import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EventsFilterBarProps {
  filters: {
    search: string;
    status: string;
    tipo: string;
  };
  setFilters: (filters: { search: string; status: string; tipo: string }) => void;
}

export default function EventsFilterBar({ filters, setFilters }: EventsFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const hasActiveFilters = filters.search || filters.status !== 'todos' || filters.tipo !== 'todos';

  const limparFiltros = () => {
    setSearchValue('');
    setFilters({ search: '', status: 'todos', tipo: 'todos' });
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Buscar por nome, cidade ou tipo..."
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
          <option value="Ativo">Ativo</option>
          <option value="Finalizado">Finalizado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        {/* Select de Tipo */}
        <select
          value={filters.tipo}
          onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[180px]"
        >
          <option value="todos">Todos os Tipos</option>
          <option value="Role">Role</option>
          <option value="Encontro">Encontro</option>
          <option value="Manutenção">Manutenção</option>
          <option value="Confraternização">Confraternização</option>
          <option value="Aniversário">Aniversário</option>
          <option value="Outro">Outro</option>
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


