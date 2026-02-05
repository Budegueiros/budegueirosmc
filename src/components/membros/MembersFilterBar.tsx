import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface FilterState {
  search: string;
  cargoId: string | null;
  status: 'all' | 'ativo' | 'inativo';
}

interface MembersFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

interface Cargo {
  id: string;
  nome: string;
}

export default function MembersFilterBar({ filters, onFiltersChange }: MembersFilterBarProps) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(true);
  const [searchValue, setSearchValue] = useState(filters.search);

  useEffect(() => {
    carregarCargos();
  }, []);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const carregarCargos = async () => {
    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nivel', { ascending: true });

      if (error) throw error;
      setCargos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    } finally {
      setLoadingCargos(false);
    }
  };

  const handleCargoChange = (cargoId: string) => {
    onFiltersChange({ 
      ...filters, 
      cargoId: cargoId === 'all' ? null : cargoId 
    });
  };

  const handleStatusChange = (status: 'all' | 'ativo' | 'inativo') => {
    onFiltersChange({ ...filters, status });
  };

  const hasActiveFilters = filters.search || filters.cargoId !== null || filters.status !== 'all';

  const limparFiltros = () => {
    setSearchValue('');
    onFiltersChange({
      search: '',
      cargoId: null,
      status: 'all',
    });
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Buscar por nome, email ou carteira..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 pl-10 focus:outline-none focus:border-gray-600 transition"
          />
        </div>

        {/* Select de Cargo */}
        <select
          value={filters.cargoId || 'all'}
          onChange={(e) => handleCargoChange(e.target.value)}
          disabled={loadingCargos}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[150px]"
        >
          <option value="all">Todos os Cargos</option>
          {cargos.map((cargo) => (
            <option key={cargo.id} value={cargo.id}>
              {cargo.nome}
            </option>
          ))}
        </select>

        {/* Select de Status */}
        <select
          value={filters.status}
          onChange={(e) => handleStatusChange(e.target.value as 'all' | 'ativo' | 'inativo')}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-gray-600 transition min-w-[120px]"
        >
          <option value="all">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
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
