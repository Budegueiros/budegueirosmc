import { useState } from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';

interface EventosSummaryProps {
  metrics: {
    totalEventos: number;
    eventosAtivos: number;
    eventosFinalizados: number;
    proximoEvento: string | null;
    proximoEventoData?: string | null;
    proximoEventoHora?: string | null;
  };
}

export default function EventosSummary({ metrics }: EventosSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatarData = (data: string) => {
    if (!data) return '';
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="mx-4 mb-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase">Resumo</p>
            <p className="text-sm font-bold text-white">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Métricas */}
      <div className="px-4 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">{metrics.totalEventos}</p>
            <p className="text-xs text-gray-400">Eventos</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div>
            <p className="text-xl font-bold text-green-400">{metrics.eventosAtivos}</p>
            <p className="text-xs text-gray-400">Ativos</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div>
            <p className="text-xl font-bold text-gray-400">{metrics.eventosFinalizados}</p>
            <p className="text-xs text-gray-400">Finalizados</p>
          </div>
        </div>
      </div>

      {/* Próximo Evento */}
      {expanded && metrics.proximoEvento && (
        <div className="px-4 py-4 bg-blue-600/5 border-t border-blue-600/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg flex-shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-400 uppercase mb-1">Próximo</p>
              <p className="text-sm font-bold text-white mb-2">{metrics.proximoEvento}</p>
              {metrics.proximoEventoData && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">📅</span>
                  <p className="text-xs text-gray-300">
                    {formatarData(metrics.proximoEventoData)}
                    {metrics.proximoEventoHora && ` - ${metrics.proximoEventoHora}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
