interface EventosFiltersProps {
  statusFilter: string;
  tipoFilter: string;
  onStatusChange: (status: string) => void;
  onTipoChange: (tipo: string) => void;
  eventosCounts?: {
    roles?: number;
    encontros?: number;
    todos?: number;
  };
}

export default function EventosFilters({
  statusFilter,
  tipoFilter,
  onStatusChange,
  onTipoChange,
  eventosCounts = {}
}: EventosFiltersProps) {
  const chips = [
    {
      id: 'todos',
      label: 'Todos',
      count: eventosCounts.todos,
      active: tipoFilter === 'todos'
    },
    {
      id: 'Role',
      label: 'Rolês',
      icon: '🏍️',
      count: eventosCounts.roles,
      active: tipoFilter === 'Role'
    },
    {
      id: 'Encontro',
      label: 'Enc.',
      icon: '🤝',
      count: eventosCounts.encontros,
      active: tipoFilter === 'Encontro'
    }
  ];

  return (
    <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 overflow-x-auto">
      <div className="flex items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => {
              if (chip.id === 'todos' || chip.id === 'Role' || chip.id === 'Encontro') {
                onTipoChange(chip.id);
              }
            }}
            className={`
              flex items-center gap-2 px-4 h-8 rounded-full text-xs font-medium transition whitespace-nowrap
              ${chip.active
                ? 'bg-blue-600/20 border border-blue-600 text-blue-400 font-semibold'
                : 'bg-gray-800 border border-transparent text-gray-300 hover:bg-gray-750'
              }
            `}
          >
            {chip.icon && <span>{chip.icon}</span>}
            <span>{chip.label}</span>
            {chip.count !== undefined && chip.count > 0 && (
              <span className={`
                px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
                ${chip.active 
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'bg-white/20 text-white'
                }
              `}>
                {chip.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
