interface QuickFiltersProps {
  filters: {
    type: string;
    category?: string;
  };
  counts: {
    entradas: number;
    saidas: number;
  };
  onFilterChange: (key: string, value: string) => void;
  onCategoryFilter?: () => void;
  onPeriodFilter?: () => void;
}

export default function QuickFilters({
  filters,
  counts,
  onFilterChange,
  onCategoryFilter,
  onPeriodFilter,
}: QuickFiltersProps) {
  const filterButtons = [
    {
      value: 'todas',
      label: 'Todas',
      active: filters.type === 'todas' || filters.type === 'todos',
    },
    {
      value: 'entrada',
      label: 'Entradas',
      count: counts.entradas,
      active: filters.type === 'entrada',
      icon: '↗',
      color: 'green',
    },
    {
      value: 'saida',
      label: 'Saídas',
      count: counts.saidas,
      active: filters.type === 'saida',
      icon: '↘',
      color: 'red',
    },
  ];

  return (
    <div className="py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {filterButtons.map((filter) => {
          const isActive = filter.active;
          const bgColor =
            filter.value === 'entrada' && isActive
              ? 'bg-green-500/15 border-green-500/50'
              : filter.value === 'saida' && isActive
              ? 'bg-red-500/15 border-red-500/50'
              : isActive
              ? 'bg-blue-600 border-blue-600'
              : 'bg-gray-800 border-gray-700';
          
          const textColor = isActive
            ? filter.value === 'entrada'
              ? 'text-green-400'
              : filter.value === 'saida'
              ? 'text-red-400'
              : 'text-white'
            : 'text-gray-300';

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange('type', filter.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition border ${bgColor} ${textColor} hover:opacity-90`}
            >
              {filter.icon && <span className="text-base">{filter.icon}</span>}
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

        {/* Botão de Categorias */}
        {onCategoryFilter && (
          <button
            onClick={onCategoryFilter}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <span>Categorias</span>
            <span className="text-xs">▾</span>
          </button>
        )}

        {/* Botão de Período */}
        {onPeriodFilter && (
          <button
            onClick={onPeriodFilter}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <span>Janeiro</span>
            <span className="text-xs">▾</span>
          </button>
        )}
      </div>
    </div>
  );
}
