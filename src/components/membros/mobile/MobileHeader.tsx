import { Link } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  notificationCount?: number;
  backTo?: string;
}

export default function MobileHeader({ 
  title, 
  notificationCount = 0,
  backTo = '/admin'
}: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          to={backTo}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </Link>

        {notificationCount > 0 && (
          <Link
            to="/notifications"
            className="relative p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

