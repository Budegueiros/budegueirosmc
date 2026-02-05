import { useState, useEffect } from 'react';
import { Search, X, Settings } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  value?: string;
}

export default function SearchBar({
  onSearch,
  onFilterPress,
  placeholder = 'Buscar transação...',
  value: externalValue,
}: SearchBarProps) {
  const [searchText, setSearchText] = useState(externalValue || '');

  // Sincronizar com valor externo se fornecido
  useEffect(() => {
    if (externalValue !== undefined) {
      setSearchText(externalValue);
    }
  }, [externalValue]);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, onSearch]);

  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          {searchText.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {onFilterPress && (
          <button
            onClick={onFilterPress}
            className="w-11 h-11 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700 transition"
            aria-label="Filtros avançados"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
