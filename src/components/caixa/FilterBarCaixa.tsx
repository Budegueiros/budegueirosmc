import { Search, X, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CategoriaFluxoCaixa } from '../../types/database.types';

interface FilterBarCaixaProps {
  filters: {
    search: string;
    dataInicio: string;
    dataFim: string;
    categoria: string;
    tipo: string;
    apenasPendentes?: boolean;
  };
  setFilters: (filters: {
    search: string;
    dataInicio: string;
    dataFim: string;
    categoria: string;
    tipo: string;
    apenasPendentes?: boolean;
  }) => void;
  categorias: Array<{ nome: string; tipo: string }>;
}

export default function FilterBarCaixa({ filters, setFilters, categorias }: FilterBarCaixaProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const hasActiveFilters = 
    filters.search || 
    filters.dataInicio || 
    filters.dataFim || 
    filters.categoria !== 'todas' || 
    filters.tipo !== 'todos';

  const limparFiltros = () => {
    setSearchValue('');
    setFilters({ 
      search: '', 
      dataInicio: '', 
      dataFim: '', 
      categoria: 'todas',
      tipo: 'todos',
      apenasPendentes: false
    });
  };

  // Separar categorias por tipo
  const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
  const categoriasSaida = categorias.filter(c => c.tipo === 'saida');

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Buscar por descrição ou nome..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 pl-10 focus:outline-none focus:border-gray-600 transition"
          />
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-400 w-5 h-5" />
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:border-gray-600 transition text-sm"
              placeholder="Data início"
            />
            <span className="text-gray-400 self-center">até</span>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:border-gray-600 transition text-sm"
              placeholder="Data fim"
            />
          </div>
        </div>

        {/* Filtro de Tipo */}
        <select
          value={filters.tipo}
          onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[120px]"
        >
          <option value="todos">Todos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>

        {/* Filtro de Categoria */}
        <select
          value={filters.categoria}
          onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[150px]"
        >
          <option value="todas">Todas as Categorias</option>
          {filters.tipo === 'entrada' || filters.tipo === 'todos' ? (
            <>
              <optgroup label="Entradas">
                {categoriasEntrada.map((cat) => (
                  <option key={cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </optgroup>
            </>
          ) : null}
          {filters.tipo === 'saida' || filters.tipo === 'todos' ? (
            <>
              <optgroup label="Saídas">
                {categoriasSaida.map((cat) => (
                  <option key={cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </optgroup>
            </>
          ) : null}
        </select>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            onClick={limparFiltros}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition px-4 py-2 rounded-md hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

