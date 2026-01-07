// ============================================================================
// Componente MembersFilterBar
// ============================================================================
// Descrição: Barra de filtros para busca e filtragem de membros
// Data: 2025-01-XX
// ============================================================================

import { Search, Filter, X } from 'lucide-react';
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

/**
 * Componente de barra de filtros para membros
 * 
 * @param filters - Estado atual dos filtros
 * @param onFiltersChange - Callback quando os filtros mudam
 * 
 * @example
 * ```tsx
 * <MembersFilterBar 
 *   filters={filters} 
 *   onFiltersChange={setFilters} 
 * />
 * ```
 */
export default function MembersFilterBar({ filters, onFiltersChange }: MembersFilterBarProps) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(true);

  useEffect(() => {
    carregarCargos();
  }, []);

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

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
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

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      cargoId: null,
      status: 'all',
    });
  };

  const hasActiveFilters = filters.search !== '' || filters.cargoId !== null || filters.status !== 'all';

  return (
    <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B0B0B0] w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou carteira..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D32F2F] transition"
          />
        </div>

        {/* Filtro por Cargo */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B0B0B0] w-4 h-4 pointer-events-none" />
          <select
            value={filters.cargoId || 'all'}
            onChange={(e) => handleCargoChange(e.target.value)}
            disabled={loadingCargos}
            className="w-full md:w-48 bg-[#121212] border border-[#D32F2F]/30 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#D32F2F] transition appearance-none cursor-pointer"
          >
            <option value="all">Todos os Cargos</option>
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as 'all' | 'ativo' | 'inativo')}
            className="w-full md:w-40 bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D32F2F] transition appearance-none cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 bg-[#121212] hover:bg-[#1E1E1E] border border-[#D32F2F]/30 hover:border-[#D32F2F] text-[#B0B0B0] hover:text-white px-4 py-2.5 rounded-lg transition font-oswald uppercase text-sm whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

