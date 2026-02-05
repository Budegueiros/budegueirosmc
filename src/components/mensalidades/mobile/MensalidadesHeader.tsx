import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';

interface MensalidadesHeaderProps {
  onReportPress?: () => void;
}

export default function MensalidadesHeader({ onReportPress }: MensalidadesHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          to="/admin"
          className="flex items-center gap-2 text-white hover:text-gray-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Gerenciar Mensalidades</h1>
        </Link>

        {onReportPress && (
          <button
            onClick={onReportPress}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

