import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface EventsMetricsCardsProps {
  metrics: {
    totalEventos: number;
    eventosAtivos: number;
    eventosFinalizados: number;
    proximoEvento: string | null;
  };
}

export default function EventsMetricsCards({ metrics }: EventsMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total de Eventos */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total de Eventos</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.totalEventos}
          </p>
          <p className="text-xs text-gray-500">Todos os eventos</p>
        </div>
      </div>

      {/* Eventos Ativos */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Eventos Ativos</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.eventosAtivos}
          </p>
          <p className="text-xs text-gray-500">Em andamento</p>
        </div>
      </div>

      {/* Finalizados */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gray-500/10 rounded-lg">
            <XCircle className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Finalizados</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.eventosFinalizados}
          </p>
          <p className="text-xs text-gray-500">Concluídos</p>
        </div>
      </div>

      {/* Próximo Evento */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Próximo Evento</p>
          <p className="text-lg font-bold text-white mb-1 truncate">
            {metrics.proximoEvento || 'Nenhum'}
          </p>
          <p className="text-xs text-gray-500">Próxima data</p>
        </div>
      </div>
    </div>
  );
}


