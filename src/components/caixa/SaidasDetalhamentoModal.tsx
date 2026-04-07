import { useEffect } from 'react';
import { FluxoCaixaComMembro } from '../../types/database.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  saidas: FluxoCaixaComMembro[];
  total: number;
  onViewAnexo: (url: string, fileName?: string) => void;
};

export default function SaidasDetalhamentoModal({
  isOpen,
  onClose,
  saidas,
  total,
  onViewAnexo
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Detalhamento das saídas</h2>
            <p className="text-sm text-gray-400">
              Total:{' '}
              <span className="text-red-400 font-medium">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo */}
        <div className="max-h-[70vh] overflow-auto px-6 py-4">
          {saidas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">Nenhuma saída encontrada para este período</p>
            </div>
          ) : (
            <>
              {/* Desktop - Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-3 pr-4">Data</th>
                      <th className="py-3 pr-4">Despesa</th>
                      <th className="py-3 pr-4">Categoria</th>
                      <th className="py-3 pr-4">Responsável</th>
                      <th className="py-3 pr-4">Valor</th>
                      <th className="py-3">Comprovante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saidas.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-800/50 text-sm text-gray-200 hover:bg-gray-800/30 transition"
                      >
                        <td className="py-3 pr-4 text-gray-400">{item.data}</td>
                        <td className="py-3 pr-4">{item.descricao}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-400">
                          {item.membros?.nome_guerra || '-'}
                        </td>
                        <td className="py-3 pr-4 font-medium text-red-400">
                          {item.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </td>
                        <td className="py-3">
                          {item.anexo_url ? (
                            <button
                              onClick={() => onViewAnexo(item.anexo_url!)}
                              className="inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white transition"
                            >
                              Ver comprovante
                            </button>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                              Sem comprovante
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile - Cards */}
              <div className="md:hidden space-y-3">
                {saidas.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-800 bg-gray-800/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{item.data}</p>
                        <p className="text-sm text-white font-medium truncate">{item.descricao}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.categoria}</p>
                        <p className="text-xs text-gray-500">{item.membros?.nome_guerra || '-'}</p>
                      </div>
                      <div className="text-red-400 text-sm font-semibold whitespace-nowrap">
                        {item.valor.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </div>
                    </div>

                    <div className="mt-3">
                      {item.anexo_url ? (
                        <button
                          onClick={() => onViewAnexo(item.anexo_url!)}
                          className="w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-white transition"
                        >
                          Ver comprovante
                        </button>
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                          Sem comprovante
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer com contador */}
        <div className="border-t border-gray-800 px-6 py-3">
          <p className="text-xs text-gray-500">
            {saidas.length} {saidas.length === 1 ? 'saída encontrada' : 'saídas encontradas'}
          </p>
        </div>
      </div>
    </div>
  );
}
