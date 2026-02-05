// ============================================================================
// Página ManageCategoriasCaixa
// ============================================================================
// Descrição: Página administrativa para gerenciar categorias do fluxo de caixa
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tag, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useCategoriasCaixa, CategoriaComEstatisticas } from '../hooks/useCategoriasCaixa';
import { TipoFluxoCaixa } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';
import EditCategoriaModal from '../components/categorias-caixa/EditCategoriaModal';
import CategoriasCaixaList from '../components/categorias-caixa/CategoriasCaixaList';

export default function ManageCategoriasCaixa() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  
  const {
    categorias,
    loading,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    toggleCategoriaStatus,
  } = useCategoriasCaixa();

  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaComEstatisticas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tipoCriacao, setTipoCriacao] = useState<TipoFluxoCaixa>('entrada');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCategorias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCreate = (tipo: TipoFluxoCaixa) => {
    setIsCreating(true);
    setTipoCriacao(tipo);
    setSelectedCategoria(null);
    setIsModalOpen(true);
  };

  const handleEdit = (categoria: CategoriaComEstatisticas) => {
    setIsCreating(false);
    setSelectedCategoria(categoria);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategoria(null);
    setIsCreating(false);
  };

  const handleSave = async (data: {
    nome: string;
    tipo: TipoFluxoCaixa;
    cor?: string | null;
    descricao?: string | null;
    ativo?: boolean;
    ordem?: number;
  }) => {
    try {
      if (isCreating) {
        await createCategoria({ ...data, tipo: tipoCriacao });
      } else if (selectedCategoria) {
        await updateCategoria(selectedCategoria.id, data);
      }
    } catch (error: any) {
      throw error; // Re-throw para o modal tratar
    }
  };

  const handleToggleStatus = async (categoria: CategoriaComEstatisticas) => {
    if (categoria.lancamentos_count > 0 && categoria.ativo) {
      const confirmar = window.confirm(
        `Esta categoria está sendo usada em ${categoria.lancamentos_count} lançamento(s). Deseja realmente desativá-la?`
      );
      if (!confirmar) return;
    }

    try {
      await toggleCategoriaStatus(categoria.id, categoria.ativo);
      toastSuccess('Status da categoria alterado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar status da categoria:', error);
      toastError(error.message || 'Erro ao alterar status da categoria.');
    }
  };

  if (loading || adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D32F2F] animate-spin mx-auto mb-4" />
            <p className="text-[#B0B0B0] font-oswald uppercase text-sm tracking-wider">
              Carregando...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4 mb-4">
            <Link to="/admin" className="text-[#B0B0B0] hover:text-white transition flex-shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Tag className="w-6 h-6 md:w-8 md:h-8 text-[#D32F2F] flex-shrink-0" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white uppercase break-words">
              Gerenciar Categorias
            </h1>
          </div>
          <p className="text-[#B0B0B0] text-sm md:text-lg">
            Crie e gerencie as categorias de entradas e saídas do fluxo de caixa
          </p>
        </div>

        {/* Botões Criar */}
        {!isModalOpen && (
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleCreate('entrada')}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-oswald uppercase font-bold px-4 md:px-6 py-3 rounded-lg transition w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nova Categoria de Entrada
            </button>
            <button
              onClick={() => handleCreate('saida')}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-oswald uppercase font-bold px-4 md:px-6 py-3 rounded-lg transition w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nova Categoria de Saída
            </button>
          </div>
        )}

        {/* Lista de Categorias */}
        <CategoriasCaixaList
          categorias={categorias}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Modal de Edição/Criação */}
        <EditCategoriaModal
          categoria={selectedCategoria}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          isCreating={isCreating}
        />
      </div>
    </DashboardLayout>
  );
}

