import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

interface EventosHeaderProps {
  backTo?: string;
}

export default function EventosHeader({ backTo = '/admin' }: EventosHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          to={backTo}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition min-h-[44px] min-w-[44px] -ml-2 pl-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <h1 className="text-base font-semibold">Gerenciar Eventos</h1>
        </Link>

        <Link
          to="/create-event"
          className="flex items-center justify-center w-11 h-11 bg-gray-800 hover:bg-gray-700 rounded-lg transition min-h-[44px] min-w-[44px]"
          aria-label="Criar evento"
        >
          <Calendar className="w-5 h-5 text-white" />
        </Link>
      </div>
    </div>
  );
}
