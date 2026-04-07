import { useEffect, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { FluxoCaixaComMembro, CategoriaFluxoCaixa } from '../../types/database.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entradas: FluxoCaixaComMembro[];
  total: number;
};

const CORES_CATEGORIA: Record<string, { badge: string; bar: string }> = {
  Mensalidade: { badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30', bar: 'bg-blue-500' },
  Doação:      { badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30', bar: 'bg-purple-500' },
  Venda:       { badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30', bar: 'bg-yellow-500' },
  Evento:      { badge: 'bg-green-500/10 text-green-300 border-green-500/30', bar: 'bg-green-500' },
  Outros:      { badge: 'bg-gray-500/10 text-gray-300 border-gray-500/30', bar: 'bg-gray-500' },
};

export default function EntradasDetalhamentoModal({ isOpen, onClose, entradas, total }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const grupos = useMemo(() => {
    const map = new Map<CategoriaFluxoCaixa, FluxoCaixaComMembro[]>();
    for (const item of entradas) {
      const lista = map.get(item.categoria) ?? [];
      lista.push(item);
      map.set(item.categoria, lista);
    }
    return Array.from(map.entries())
      .map(([categoria, itens]) => ({
        categoria,
        quantidade: itens.length,
        subtotal: itens.reduce((acc, i) => acc + i.valor, 0),
      }))
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [entradas]);

  if (!isOpen) return null;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Entradas por Categoria</h2>
              <p className="text-sm text-gray-400">
                Total:{' '}
                <span className="text-blue-400 font-medium">{fmt(total)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-auto px-6 py-4">
          {grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">Nenhuma entrada encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grupos.map(({ categoria, quantidade, subtotal }) => {
                const cor = CORES_CATEGORIA[categoria] ?? CORES_CATEGORIA['Outros'];
                const percentual = total > 0 ? (subtotal / total) * 100 : 0;

                return (
                  <div key={categoria} className="rounded-xl border border-gray-800 bg-gray-800/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${cor.badge}`}>
                          {categoria}
                        </span>
                        <span className="text-xs text-gray-500">
                          {quantidade} {quantidade === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-400">{fmt(subtotal)}</p>
                        <p className="text-xs text-gray-500">{percentual.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cor.bar} transition-all duration-500`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-3 shrink-0">
          <p className="text-xs text-gray-500">
            {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'} em {grupos.length}{' '}
            {grupos.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
      </div>
    </div>
  );
}
