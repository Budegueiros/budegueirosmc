import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FABProps {
  to: string;
  ariaLabel?: string;
}

export default function FAB({ to, ariaLabel = 'Criar evento' }: FABProps) {
  return (
    <Link
      to={to}
      className="fixed bottom-6 right-4 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-xl transition-all active:scale-95"
      aria-label={ariaLabel}
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
      }}
    >
      <Plus className="w-7 h-7 font-light" strokeWidth={2.5} />
    </Link>
  );
}
