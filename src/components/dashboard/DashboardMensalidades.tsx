/**
 * Componente para exibir mensalidades no Dashboard
 */
import { Link } from 'react-router-dom';
import { FaMoneyBillAlt } from 'react-icons/fa';
import { MensalidadeData } from '../../services/mensalidadeService';

interface DashboardMensalidadesProps {
  mensalidades: MensalidadeData[];
}

/**
 * Formata uma data para formato brasileiro
 */
function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('T')[0].split('-');
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
}

export function DashboardMensalidades({ mensalidades }: DashboardMensalidadesProps) {
  return (
    <div>
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
          <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
            <FaMoneyBillAlt className="w-5 h-5 text-brand-red" />
            MENSALIDADES
          </h3>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {/* Tabela de Mensalidades */}
          <div className="space-y-2">
            {/* Header da Tabela */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-800 text-gray-500 text-xs uppercase">
              <div className="col-span-4">Mês/Ano</div>
              <div className="col-span-3">Vencimento</div>
              <div className="col-span-3 text-right">Valor</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Mostrar últimas mensalidades */}
            {mensalidades.slice(0, 5).map((mensalidade) => {
              const date = new Date(mensalidade.mes_referencia + 'T00:00:00');
              const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              const vencimento = formatarData(mensalidade.data_vencimento);

              // Determinar cor do status
              let statusClass = '';
              let statusText = mensalidade.status.toUpperCase();

              if (mensalidade.status === 'Pago') {
                statusClass = 'bg-green-950/50 text-green-500';
                statusText = 'PAGO';
              } else if (mensalidade.status === 'Atrasado') {
                statusClass = 'bg-red-950/50 text-brand-red';
                statusText = 'ATRASADO';
              } else if (mensalidade.status === 'Aberto' || mensalidade.status === 'Pendente') {
                statusClass = 'bg-yellow-950/50 text-yellow-500';
                statusText = mensalidade.status === 'Aberto' ? 'ABERTO' : 'PENDENTE';
              } else {
                statusClass = 'bg-gray-950/50 text-gray-500';
              }

              return (
                <div key={mensalidade.id} className="grid grid-cols-12 gap-2 py-2 text-sm border-b border-gray-800/50">
                  <div className="col-span-4 text-white capitalize font-medium">{mesAno}</div>
                  <div className="col-span-3 text-gray-400">{vencimento}</div>
                  <div className="col-span-3 text-right text-white font-semibold">
                    R$ {mensalidade.valor.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`inline-flex items-center gap-1 ${statusClass} px-2 py-0.5 rounded text-xs font-bold`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}

            {mensalidades.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">Nenhuma mensalidade encontrada</div>
            )}
          </div>

          {/* Link Ver Tudo */}
          <Link
            to="/my-payments"
            className="block text-center text-brand-red hover:text-red-400 font-oswald text-sm uppercase font-bold mt-6 transition"
          >
            Ver Todo Histórico
          </Link>
        </div>
      </div>
    </div>
  );
}
