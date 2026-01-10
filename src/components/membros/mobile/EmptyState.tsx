import { Search, X } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters?: () => void;
  message?: string;
}

export default function EmptyState({ 
  onClearFilters, 
  message = 'Nenhum membro encontrado' 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Search className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
      <p className="text-gray-400 text-center mb-6 max-w-sm">
        Tente ajustar os filtros ou buscar por outro termo
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
          Limpar Filtros
        </button>
      )}
    </div>
  );
}

