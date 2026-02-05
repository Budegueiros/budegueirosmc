import { LucideIcon, TrendingUp, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  alert?: boolean;
  loading?: boolean;
}

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  alert = false,
  loading = false 
}: StatCardProps) {
  return (
    <div 
      className={`
        bg-[#111111] rounded-lg border transition-all duration-200
        ${alert 
          ? 'border-red-500/50 hover:border-red-500 hover:shadow-[0_0_20px_rgba(211,47,47,0.3)]' 
          : 'border-gray-800 hover:border-gray-700 hover:bg-[#161616]'
        }
        p-4 md:p-6
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
          ${alert ? 'bg-red-500/20' : 'bg-brand-red/20'}
        `}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${alert ? 'text-red-500' : 'text-brand-red'}`} />
        </div>
        {trend && (
          <div className={`
            flex items-center gap-1 text-xs
            ${trend.positive !== false ? 'text-green-400' : 'text-gray-500'}
          `}>
            {trend.positive !== false ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}</span>
          </div>
        )}
      </div>
      
      <div className={`
        text-2xl md:text-3xl lg:text-4xl font-bold font-oswald mb-2
        ${alert ? 'text-red-500' : 'text-white'}
      `}>
        {loading ? '...' : value}
      </div>
      
      <div className="text-zinc-400 text-xs md:text-sm uppercase font-oswald">
        {label}
      </div>
      
      {trend && (
        <div className="mt-2 text-xs text-zinc-500">
          {trend.label}
        </div>
      )}
    </div>
  );
}

