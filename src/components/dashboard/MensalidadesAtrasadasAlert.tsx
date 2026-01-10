/**
 * Componente para alerta de mensalidades em atraso
 */
import { Link } from 'react-router-dom';
import { FaMoneyBillAlt } from 'react-icons/fa';
import { MensalidadeData } from '../../services/mensalidadeService';

interface MensalidadesAtrasadasAlertProps {
  mensalidades: MensalidadeData[];
}

export function MensalidadesAtrasadasAlert({ mensalidades }: MensalidadesAtrasadasAlertProps) {
  if (mensalidades.length === 0) return null;

  return (
    <div className="bg-red-950/50 border-2 border-brand-red rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-brand-red/20 p-3 rounded-lg">
            <FaMoneyBillAlt className="w-8 h-8 text-brand-red" />
          </div>
          <div>
            <h3 className="text-white font-oswald text-2xl uppercase font-bold">
              MENSALIDADE EM ATRASO
            </h3>
            <p className="text-gray-300 text-sm mt-1">
              Você possui {mensalidades.length} mensalidade pendente. Regularize agora para evitar bloqueio.
            </p>
          </div>
        </div>
        <Link
          to="/my-payments"
          className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-oswald uppercase font-bold text-sm transition hover:scale-105 transform"
        >
          Ver Mensalidades
        </Link>
      </div>
    </div>
  );
}
