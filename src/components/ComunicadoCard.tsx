import { AlertTriangle, Info, Megaphone, CheckCheck, Eye } from 'lucide-react';
import { ComunicadoComAutor } from '../types/database.types';

interface ComunicadoCardProps {
  comunicado: ComunicadoComAutor;
  onMarcarComoLido: (id: string) => void;
}

export default function ComunicadoCard({ comunicado, onMarcarComoLido }: ComunicadoCardProps) {
  const isCritica = comunicado.prioridade === 'critica';
  const isAlta = comunicado.prioridade === 'alta';

  const getBorderColor = () => {
    if (isCritica) return 'border-red-600';
    if (isAlta) return 'border-orange-500';
    return 'border-gray-800';
  };

  const getBgColor = () => {
    if (isCritica) return 'bg-red-900/10';
    if (isAlta) return 'bg-orange-900/10';
    return 'bg-zinc-800';
  };

  const getIcon = () => {
    if (isCritica) return <AlertTriangle className="text-red-500" size={24} />;
    if (isAlta) return <Megaphone className="text-orange-500" size={24} />;
    return <Info className="text-blue-500" size={24} />;
  };

  const getDestinatarioLabel = () => {
    if (comunicado.tipo_destinatario === 'geral') return 'GERAL';
    if (comunicado.tipo_destinatario === 'cargo') {
      return `CARGO: ${comunicado.valor_destinatario}`;
    }
    return 'MENSAGEM PRIVADA';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`rounded-lg border p-6 mb-4 relative transition-all ${getBorderColor()} ${getBgColor()} ${
        !comunicado.ja_lido ? 'shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'opacity-80'
      }`}
    >
      {/* Indicador de não lido */}
      {!comunicado.ja_lido && (
        <div className="absolute top-0 right-0 p-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="flex gap-4 items-start">
        <div className="mt-1 flex-shrink-0">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${isCritica ? 'text-red-500' : 'text-white'} font-oswald uppercase`}>
                {comunicado.titulo}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{formatarData(comunicado.created_at)}</span>
                <span>•</span>
                <span>Por: {comunicado.autor.nome_guerra}</span>
                <span>•</span>
                <span className="uppercase border border-gray-700 px-2 py-0.5 rounded text-xs">
                  {getDestinatarioLabel()}
                </span>
              </div>
            </div>
            {comunicado.ja_lido ? (
              <div className="flex items-center gap-1 text-green-500 text-xs mt-2 md:mt-0 bg-green-900/20 px-2 py-1 rounded">
                <CheckCheck size={14} /> Lido
              </div>
            ) : (
              <button
                onClick={() => onMarcarComoLido(comunicado.id)}
                className="flex items-center gap-2 text-white hover:text-white text-sm font-semibold mt-2 md:mt-0 bg-brand-red/20 hover:bg-brand-red/30 border-2 border-brand-red/50 hover:border-brand-red px-4 py-2 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-zinc-800 shadow-lg hover:shadow-brand-red/20"
              >
                <Eye size={16} /> Marcar como lido
              </button>
            )}
          </div>

          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mt-4 border-t border-gray-700/50 pt-3">
            {comunicado.conteudo}
          </div>
        </div>
      </div>
    </div>
  );
}
