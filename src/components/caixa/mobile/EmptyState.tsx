interface EmptyStateProps {
  onClearFilters?: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="mx-4 mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
      <p className="text-gray-400 text-lg mb-2">Nenhuma transação encontrada</p>
      <p className="text-gray-500 text-sm mb-4">
        Registre uma entrada ou saída para começar
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
