/**
 * Componente para exibir o próximo evento no Dashboard
 */
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { Evento } from '../../types/database.types';

interface ProximoEventoCardProps {
  evento: Evento | null;
  confirmados: number;
  membroId: string;
  confirmacaoId: string | null;
  confirmandoPresenca: boolean;
  onConfirmarPresenca: () => Promise<void>;
}

export function ProximoEventoCard({
  evento,
  confirmados,
  membroId,
  confirmacaoId,
  confirmandoPresenca,
  onConfirmarPresenca,
}: ProximoEventoCardProps) {
  if (!evento) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center">
        <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Nenhum evento programado</p>
      </div>
    );
  }

  // Parsear a data manualmente para evitar problemas de fuso horário
  const [ano, mes, dia] = evento.data_evento.split('T')[0].split('-');
  const dataEvento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

  return (
    <div className="h-full">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
          <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-red" />
            PRÓXIMO ROLE
          </h3>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {/* Título e Data Lado a Lado */}
          <div className="flex items-start justify-between gap-4 mb-5">
            {/* Nome do Evento */}
            <h4 className="text-white font-oswald text-2xl uppercase font-bold flex-1">{evento.nome}</h4>

            {/* Data Grande à Direita */}
            <div className="text-center min-w-[80px]">
              <div className="text-brand-red font-oswald text-4xl font-bold leading-none">
                {dataEvento.getDate()}
              </div>
              <div className="text-gray-400 font-oswald text-xs uppercase">
                {dataEvento.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Local */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white text-sm">{evento.local_saida}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {evento.cidade}/{evento.estado}
                </p>
              </div>
            </div>
            <Link
              to="/agenda"
              className="flex items-center gap-2 text-gray-400 hover:text-brand-red transition text-xs"
            >
              <MapPin className="w-4 h-4" />
              VER NO MAPA
            </Link>
          </div>

          {/* Confirmados */}
          <div className="flex items-center gap-2 mb-5 text-gray-400 text-sm">
            <Users className="w-5 h-5" />
            <span>{confirmados} irmãos confirmados</span>
          </div>

          {/* Spacer para empurrar o botão para baixo */}
          <div className="flex-grow"></div>

          {/* Botão de Confirmação */}
          <button
            onClick={onConfirmarPresenca}
            disabled={confirmandoPresenca}
            className={`w-full font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition ${
              confirmacaoId
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-brand-red hover:bg-red-700 text-white'
            } disabled:opacity-50`}
          >
            {confirmandoPresenca ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Processando...
              </>
            ) : confirmacaoId ? (
              'PRESENÇA CONFIRMADA'
            ) : (
              'CONFIRMAR PRESENÇA'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
