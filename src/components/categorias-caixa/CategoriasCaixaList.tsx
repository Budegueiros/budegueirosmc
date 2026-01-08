// ============================================================================
// Componente CategoriasCaixaList
// ============================================================================
// Descrição: Lista administrativa de categorias do fluxo de caixa para Desktop
// Data: 2025-01-XX
// ============================================================================

import { Edit2, Tag, X, Receipt } from 'lucide-react';
import { CategoriaComEstatisticas } from '../../hooks/useCategoriasCaixa';
import CategoriaBadge from '../caixa/CategoriaBadge';

interface CategoriasCaixaListProps {
  categorias: CategoriaComEstatisticas[];
  onEdit: (categoria: CategoriaComEstatisticas) => void;
  onToggleStatus: (categoria: CategoriaComEstatisticas) => void;
}

export default function CategoriasCaixaList({
  categorias,
  onEdit,
  onToggleStatus,
}: CategoriasCaixaListProps) {
  if (categorias.length === 0) {
    return (
      <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg p-12 text-center">
        <Tag className="w-16 h-16 text-[#B0B0B0]/30 mx-auto mb-4" />
        <p className="text-[#B0B0B0] font-oswald uppercase">Nenhuma categoria cadastrada</p>
      </div>
    );
  }

  // Separar categorias por tipo
  const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
  const categoriasSaida = categorias.filter(c => c.tipo === 'saida');

  return (
    <div className="space-y-6">
      {/* Categorias de Entrada */}
      <div>
        <h3 className="text-white font-oswald uppercase text-lg mb-4 flex items-center gap-2">
          <span className="text-green-500">Entradas</span>
        </h3>
        <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] border-b border-[#D32F2F]/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Lançamentos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D32F2F]/10">
                {categoriasEntrada.map((categoria) => (
                  <tr
                    key={categoria.id}
                    className={`hover:bg-[#121212]/50 transition ${
                      !categoria.ativo ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <CategoriaBadge categoria={categoria.nome as any} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#B0B0B0] text-sm">
                        {categoria.descricao || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[#B0B0B0] text-sm">
                        <Receipt className="w-4 h-4" />
                        <span>
                          {categoria.lancamentos_count} {categoria.lancamentos_count === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {categoria.ativo ? (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-950/40 text-green-400 border border-green-800/30">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(categoria)}
                          className="p-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded transition"
                          title="Editar categoria"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(categoria)}
                          className={`p-2 rounded transition ${
                            categoria.ativo
                              ? 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0]'
                              : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                          }`}
                          title={categoria.ativo ? 'Desativar categoria' : 'Ativar categoria'}
                        >
                          {categoria.ativo ? (
                            <Tag className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Categorias de Saída */}
      <div>
        <h3 className="text-white font-oswald uppercase text-lg mb-4 flex items-center gap-2">
          <span className="text-red-500">Saídas</span>
        </h3>
        <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] border-b border-[#D32F2F]/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Lançamentos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D32F2F]/10">
                {categoriasSaida.map((categoria) => (
                  <tr
                    key={categoria.id}
                    className={`hover:bg-[#121212]/50 transition ${
                      !categoria.ativo ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <CategoriaBadge categoria={categoria.nome as any} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#B0B0B0] text-sm">
                        {categoria.descricao || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[#B0B0B0] text-sm">
                        <Receipt className="w-4 h-4" />
                        <span>
                          {categoria.lancamentos_count} {categoria.lancamentos_count === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {categoria.ativo ? (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-950/40 text-green-400 border border-green-800/30">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(categoria)}
                          className="p-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded transition"
                          title="Editar categoria"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(categoria)}
                          className={`p-2 rounded transition ${
                            categoria.ativo
                              ? 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0]'
                              : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                          }`}
                          title={categoria.ativo ? 'Desativar categoria' : 'Ativar categoria'}
                        >
                          {categoria.ativo ? (
                            <Tag className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

