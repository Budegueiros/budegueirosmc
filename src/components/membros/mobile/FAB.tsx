import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FABProps {
  to?: string;
  onClick?: () => void;
  label?: string;
}

export default function FAB({ to, onClick, label }: FABProps) {
  const buttonClass = "w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95";

  if (to) {
    return (
      <Link to={to} className="fixed bottom-6 right-4 z-40" aria-label={label || 'Adicionar novo'}>
        <div className={buttonClass}>
          <Plus className="w-6 h-6" />
        </div>
      </Link>
    );
  }

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <button
        onClick={onClick}
        className={buttonClass}
        aria-label={label || 'Adicionar novo'}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

