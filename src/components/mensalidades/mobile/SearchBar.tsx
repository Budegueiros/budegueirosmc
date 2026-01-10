import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Buscar membro...',
  value: externalValue,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(externalValue || '');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  // Sincronizar com valor externo
  useEffect(() => {
    if (externalValue !== undefined) {
      setSearchValue(externalValue);
    }
  }, [externalValue]);

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition pl-10 pr-10"
        />
        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

