import { MapPin, Clock, Navigation, ThumbsUp, Loader2, Users, Share2 } from 'lucide-react';
import { useState } from 'react';
import ShareEventoModal from './eventos/ShareEventoModal';
import MembrosConfirmadosModal from './eventos/MembrosConfirmadosModal';

interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  distancia_km: number | null;
  foto_capa_url: string | null;
  cidade: string;
  estado: string;
}

interface MembroData {
  id: string;
  nome_guerra: string;
}

interface AgendaEventCardProps {
  event: Evento;
  currentMember?: MembroData | null;
  onRSVP?: (eventId: string, tipoEvento: string) => void;
  isConfirmed?: boolean;
  isConfirming?: boolean;
  confirmadosCount?: number;
  budegueirasCount?: number;
  visitantesCount?: number;
}

export const AgendaEventCard: React.FC<AgendaEventCardProps> = ({
  event,
  currentMember,
  onRSVP,
  isConfirmed = false,
  isConfirming = false,
  confirmadosCount = 0,
  budegueirasCount = 0,
  visitantesCount = 0,
}) => {
  const eventDate = new Date(`${event.data_evento}T00:00:00`);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
  const weekDay = eventDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const [shareOpen, setShareOpen] = useState(false);
  const [membrosModalOpen, setMembrosModalOpen] = useState(false);

  const formattedTime = event.hora_saida ? event.hora_saida.substring(0, 5) : '00:00';
  const dataFormatada = eventDate.toLocaleDateString('pt-BR');
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/agenda?evento=${event.id}` : '';
  const shareText = `Evento Budegueiros: ${event.nome} • ${dataFormatada} ${formattedTime} • Saída: ${event.local_saida}${event.local_destino ? ` • Destino: ${event.local_destino}` : ''} • ${event.cidade}/${event.estado}.`;

  // Determine Tag Color based on Type
  const getTypeColor = () => {
    switch (event.tipo_evento) {
      case 'Bate e Volta': return 'bg-orange-600';
      case 'Viagem': return 'bg-purple-600';
      case 'Reunião': return 'bg-blue-600';
      case 'Evento Social': return 'bg-green-600';
      case 'Oficial': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-[#1a1d23] rounded-lg border border-gray-800 overflow-hidden mb-6 flex flex-col md:flex-row shadow-lg hover:border-gray-600 transition-all group">
      
      {/* Left Side: Image or Date Block */}
      <div className="md:w-64 h-48 md:h-auto relative bg-[#0f1014] flex-shrink-0">
        {event.foto_capa_url ? (
          <>
            <img 
              src={event.foto_capa_url} 
              alt={event.nome} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            />
            <div className="absolute top-0 left-0 p-4">
              <div className="bg-[#0f1014]/90 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-700 shadow-xl">
                <span className="block text-red-500 font-bold text-sm uppercase tracking-wider">{month}</span>
                <span className="block text-white font-black text-3xl leading-none">{day}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-r border-gray-800 p-4">
            <span className="text-red-500 font-bold text-xl uppercase tracking-widest">{month}</span>
            <span className="text-white font-black text-6xl my-2">{day}</span>
            <span className="text-gray-500 text-sm uppercase font-bold">{weekDay}</span>
          </div>
        )}
        
        <div className={`absolute top-4 right-4 md:left-4 md:right-auto md:bottom-4 md:top-auto px-3 py-1 rounded text-[10px] font-bold text-white shadow-lg ${getTypeColor()}`}>
          {event.tipo_evento}
        </div>
      </div>

      {/* Right Side: Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{event.nome}</h3>
          </div>
          
          {event.descricao && (
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {event.descricao}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-red-500"><Clock size={18} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Horário</p>
                <p className="text-gray-200 text-sm font-medium">{formattedTime}h</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 text-red-500"><MapPin size={18} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Local / Destino</p>
                <p className="text-gray-200 text-sm font-medium">{event.local_saida}</p>
                {event.local_destino && (
                  <p className="text-xs text-gray-500 mt-1">Destino: {event.local_destino}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{event.cidade}/{event.estado}</p>
                {event.distancia_km && event.distancia_km > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Distância: {event.distancia_km} km</p>
                )}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.local_destino || event.local_saida)}`}
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-red-400 hover:text-white flex items-center gap-1 mt-1 font-bold"
                >
                  <Navigation size={10} /> Abrir Mapa
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Confirmados - só exibe se houver membro logado e contagem > 0 */}
          {currentMember && confirmadosCount > 0 && (
            <button
              onClick={() => setMembrosModalOpen(true)}
              className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors group cursor-pointer"
            >
              <Users className="w-5 h-5 group-hover:text-red-500 transition-colors" />
              <span>
                {confirmadosCount} {confirmadosCount === 1 ? 'irmão confirmado' : 'irmãos confirmados'}
                {budegueirasCount > 0 && ` • ${budegueirasCount} ${budegueirasCount === 1 ? 'Budegueira' : 'Budegueiras'}`}
                {visitantesCount > 0 && ` • ${visitantesCount} ${visitantesCount === 1 ? 'Visitante' : 'Visitantes'}`}
              </span>
            </button>
          )}

          {/* Actions */}
          {currentMember && onRSVP && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => onRSVP && onRSVP(event.id, event.tipo_evento)}
                disabled={isConfirming}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
                  isConfirmed
                    ? 'bg-green-600/20 border border-green-600 text-green-500 hover:bg-green-600/30'
                    : 'bg-[#0f1014] border border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isConfirming ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Processando...
                  </>
                ) : isConfirmed ? (
                  <>
                    <ThumbsUp size={14} /> Presença Confirmada
                  </>
                ) : (
                  <>
                    <ThumbsUp size={14} /> Eu Vou
                  </>
                )}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all bg-[#0f1014] border border-gray-700 text-gray-300 hover:border-gray-600"
              >
                <Share2 size={14} /> Compartilhar
              </button>
            </div>
          )}
        </div>
      </div>

      <ShareEventoModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareText={shareText}
        shareUrl={shareUrl}
        shareTitle="Evento Budegueiros"
        shareImageUrl={event.foto_capa_url || null}
      />

      <MembrosConfirmadosModal
        eventId={event.id}
        eventoNome={event.nome}
        isOpen={membrosModalOpen}
        onClose={() => setMembrosModalOpen(false)}
      />
    </div>
  );
};
