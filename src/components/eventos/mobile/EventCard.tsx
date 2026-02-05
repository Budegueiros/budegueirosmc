import { CheckCircle2, Eye, MoreVertical, FileText, Share2 } from 'lucide-react';
import { useState } from 'react';
import ShareEventoModal from '../ShareEventoModal';

interface Evento {
  id: string;
  nome: string;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  cidade: string;
  estado: string;
  status: string;
  max_participantes: number | null;
  vagas_limitadas: boolean;
}

interface EventCardProps {
  evento: Evento;
  confirmados?: number;
  totalMembros?: number;
  usuarioConfirmou?: boolean;
  onConfirmar?: () => void;
  onVer?: () => void;
  onMore?: () => void;
  onRelatorio?: () => void;
  index?: number;
}

const TIPO_CONFIG: Record<string, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  Role: {
    icon: '🏍️',
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.15)',
    label: 'Rolê'
  },
  Encontro: {
    icon: '🤝',
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.15)',
    label: 'Encontro'
  },
  Aniversário: {
    icon: '🎂',
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
    label: 'Aniversário'
  },
  Reunião: {
    icon: '📋',
    color: '#03A9F4',
    bgColor: 'rgba(3, 169, 244, 0.15)',
    label: 'Reunião'
  },
  Manutenção: {
    icon: '🔧',
    color: '#607D8B',
    bgColor: 'rgba(96, 125, 139, 0.15)',
    label: 'Manutenção'
  },
  Confraternização: {
    icon: '🎉',
    color: '#E91E63',
    bgColor: 'rgba(233, 30, 99, 0.15)',
    label: 'Confraternização'
  }
};

export default function EventCard({
  evento,
  confirmados = 0,
  totalMembros = 0,
  usuarioConfirmou = false,
  onConfirmar,
  onVer,
  onMore,
  onRelatorio,
  index = 0
}: EventCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const tipoConfig = TIPO_CONFIG[evento.tipo_evento] || {
    icon: '📅',
    color: '#9E9E9E',
    bgColor: 'rgba(158, 158, 158, 0.15)',
    label: evento.tipo_evento
  };

  const formatarData = (data: string) => {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatarHora = (hora: string | null) => {
    if (!hora) return '';
    return hora.substring(0, 5); // HH:MM
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/agenda?evento=${evento.id}` : '';

  const percentualConfirmados = totalMembros > 0 
    ? Math.round((confirmados / totalMembros) * 100) 
    : 0;

  const isAtivo = evento.status === 'Ativo';
  const isFinalizado = evento.status === 'Finalizado';
  const showRelatorio = isFinalizado && onRelatorio;

  const localizacao = evento.local_destino 
    ? `${evento.local_destino} - ${evento.cidade}, ${evento.estado}`
    : `${evento.local_saida} - ${evento.cidade}, ${evento.estado}`;
  const shareText = `Evento Budegueiros: ${evento.nome} • ${formatarData(evento.data_evento)}${evento.hora_saida ? ` ${formatarHora(evento.hora_saida)}` : ''} • Saída: ${evento.local_saida}${evento.local_destino ? ` • Destino: ${evento.local_destino}` : ''} • ${evento.cidade}/${evento.estado}.`;

  const delayClass = index < 5 ? `animate-delay-${index * 50}` : 'animate-delay-200';

  return (
    <div 
      className={`
        mx-4 mb-3 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg
        ${usuarioConfirmou && isAtivo ? 'border-l-4 border-l-green-500' : ''}
        ${isFinalizado ? 'opacity-90' : ''}
        animate-slide-up ${delayClass}
      `}
      style={{
        minHeight: '200px'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: tipoConfig.bgColor }}
          >
            <span className="text-2xl">{tipoConfig.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate">{evento.nome}</h3>
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ 
                  color: tipoConfig.color,
                  backgroundColor: `${tipoConfig.bgColor}`
                }}
              >
                {tipoConfig.label}
              </span>
            </div>
            <div className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold ${
              isAtivo 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isFinalizado
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {evento.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-2.5 mb-4 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 w-5">📅</span>
          <span className="text-gray-300 flex-1">
            {formatarData(evento.data_evento)}
            {evento.hora_saida && ` - ${formatarHora(evento.hora_saida)}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 w-5">📍</span>
          <span className="text-gray-300 flex-1 truncate">{localizacao}</span>
        </div>

        {isAtivo && totalMembros > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 w-5">👥</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentualConfirmados}%`,
                      backgroundColor: tipoConfig.color
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300 font-medium">
                  {confirmados}/{totalMembros} ({percentualConfirmados}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {isFinalizado && totalMembros > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 w-5">👥</span>
            <span className="text-gray-300">
              {confirmados} presentes ({percentualConfirmados}%)
            </span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        {isAtivo && onConfirmar && (
          <button
            onClick={onConfirmar}
            disabled={usuarioConfirmou}
            className={`
              flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-semibold text-sm transition
              ${usuarioConfirmou
                ? 'bg-green-500/30 border border-green-500 text-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
              }
            `}
          >
            {usuarioConfirmou ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmado</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center justify-center w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition active:scale-95"
          aria-label="Compartilhar"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {showRelatorio && (
          <button
            onClick={onRelatorio}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Relat.</span>
          </button>
        )}

        {onVer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVer();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px]"
          >
            <Eye className="w-4 h-4" />
            <span>Ver</span>
          </button>
        )}

        {onMore && (
          <button
            onClick={onMore}
            className="flex items-center justify-center w-11 h-11 bg-transparent hover:bg-gray-700 text-white rounded-lg transition active:scale-95"
            aria-label="Mais ações"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      <ShareEventoModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareText={shareText}
        shareUrl={shareUrl}
        shareTitle="Evento Budegueiros"
      />
    </div>
  );
}
