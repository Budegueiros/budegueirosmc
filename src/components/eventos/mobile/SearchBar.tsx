import { Search, Settings } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  onFilterClick,
  placeholder = 'Buscar evento, local...' 
}: SearchBarProps) {
  return (
    <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-11 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 transition"
          />
        </div>
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="flex items-center justify-center w-11 h-11 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition min-h-[44px] min-w-[44px]"
            aria-label="Filtros"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
