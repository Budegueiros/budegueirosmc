interface QuickFiltersProps {
  filters: {
    status: string;
    cargo: string;
  };
  activeFilters: {
    status: string;
    cargo: string;
  };
  onFilterChange: (key: 'status' | 'cargo', value: string) => void;
  stats?: {
    brasionados: number;
    prospects: number;
    inativos: number;
  };
}

export default function QuickFilters({ 
  filters, 
  activeFilters, 
  onFilterChange,
  stats
}: QuickFiltersProps) {
  const statusFilters = [
    { value: 'todos', label: 'Todos' },
    { value: 'brasionado', label: 'Brasionados', count: stats?.brasionados },
    { value: 'prospect', label: 'Prospects', count: stats?.prospects },
    { value: 'inativo', label: 'Inativos', count: stats?.inativos },
  ];

  return (
    <div className="py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {statusFilters.map((filter) => {
          const isActive = activeFilters.status === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange('status', filter.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

