import { Users, Shield, UserCheck, UserX } from 'lucide-react';

interface StatsCarouselProps {
  stats: {
    totalIntegrantes: number;
    brasionados: number;
    prospects: number;
    inativos: number;
  };
  onStatPress: (filter: 'todos' | 'brasionado' | 'prospect' | 'inativo') => void;
}

export default function StatsCarousel({ stats, onStatPress }: StatsCarouselProps) {
  const statCards = [
    {
      icon: Users,
      value: stats.totalIntegrantes,
      label: 'Total',
      variant: 'default' as const,
      filter: 'todos' as const,
    },
    {
      icon: Shield,
      value: stats.brasionados,
      label: 'Brasionados',
      variant: 'success' as const,
      filter: 'brasionado' as const,
    },
    {
      icon: UserCheck,
      value: stats.prospects,
      label: 'Prospects',
      variant: 'warning' as const,
      filter: 'prospect' as const,
    },
    {
      icon: UserX,
      value: stats.inativos,
      label: 'Inativos',
      variant: 'error' as const,
      filter: 'inativo' as const,
    },
  ];

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/15 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/15 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/15 border-red-500/30';
      default:
        return 'bg-gray-800/50 border-gray-700';
    }
  };

  const getIconColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="py-4 bg-gray-900 border-b border-gray-800">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
        📊 Estatísticas
      </p>
      <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.filter}
              onClick={() => onStatPress(stat.filter)}
              className={`flex-shrink-0 w-24 p-3 rounded-xl border ${getVariantStyles(stat.variant)} hover:opacity-80 transition`}
            >
              <Icon className={`w-6 h-6 ${getIconColor(stat.variant)} mb-2`} />
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

