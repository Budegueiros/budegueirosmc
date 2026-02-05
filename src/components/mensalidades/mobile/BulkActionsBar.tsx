import { CheckCircle2, X, Check } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkAsPaid: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onMarkAsPaid,
  onClear,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-blue-600">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-white" />
        <span className="text-sm font-semibold text-white">
          {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
        >
          <span className="text-sm font-semibold text-white">Limpar</span>
        </button>

        <button
          onClick={onMarkAsPaid}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
        >
          <Check className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">Dar Baixa</span>
        </button>
      </div>
    </div>
  );
}

