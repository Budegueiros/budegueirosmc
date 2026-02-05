import { ReactNode } from 'react';

interface BentoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  colSpan?: 1 | 2 | 3;
}

export default function BentoCard({ 
  title, 
  icon, 
  children, 
  className = '', 
  headerAction,
  colSpan = 1 
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-3'
  };

  return (
    <div className={`bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg overflow-hidden ${colSpanClasses[colSpan]} ${className}`}>
      <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-white text-base font-semibold flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          {title}
        </h2>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
