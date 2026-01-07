// ============================================================================
// Página ManageCargos
// ============================================================================
// Descrição: Página administrativa para gerenciar cargos do clube
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useCargos, CargoComEstatisticas } from '../hooks/useCargos';
import { TipoCargoEnum } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';
import EditRoleModal from '../components/cargos/EditRoleModal';
import CargosList from '../components/cargos/CargosList';
import CargoAccordion from '../components/cargos/CargoAccordion';

export default function ManageCargos() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  
  const {
    cargos,
    loading,
    fetchCargos,
    createCargo,
    updateCargo,
    toggleCargoStatus,
  } = useCargos();

  const [selectedCargo, setSelectedCargo] = useState<CargoComEstatisticas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCargos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCreate = () => {
    setIsCreating(true);
    setSelectedCargo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cargo: CargoComEstatisticas) => {
    setIsCreating(false);
    setSelectedCargo(cargo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargo(null);
    setIsCreating(false);
  };

  const handleSave = async (data: {
    nome: string;
    nivel: number;
    tipo_cargo: TipoCargoEnum;
    descricao: string | null;
    ativo: boolean;
  }) => {
    try {
      if (isCreating) {
        await createCargo(data);
      } else if (selectedCargo) {
        await updateCargo(selectedCargo.id, data);
      }
    } catch (error: any) {
      throw error; // Re-throw para o modal tratar
    }
  };

  const handleToggleStatus = async (cargo: CargoComEstatisticas) => {
    if (cargo.membros_count > 0 && cargo.ativo) {
      const confirmar = window.confirm(
        `Este cargo está atribuído a ${cargo.membros_count} integrante(s). Deseja realmente desativá-lo?`
      );
      if (!confirmar) return;
    }

    try {
      await toggleCargoStatus(cargo.id, cargo.ativo);
      toastSuccess('Status do cargo alterado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar status do cargo:', error);
      toastError(error.message || 'Erro ao alterar status do cargo.');
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
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#D32F2F] flex-shrink-0" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white uppercase break-words">
              Gerenciar Cargos
            </h1>
          </div>
          <p className="text-[#B0B0B0] text-sm md:text-lg">
            Crie e gerencie os cargos do clube
          </p>
        </div>

        {/* Botão Criar */}
        {!isModalOpen && (
          <div className="mb-6">
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-oswald uppercase font-bold px-4 md:px-6 py-3 rounded-lg transition w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Novo Cargo
            </button>
          </div>
        )}

        {/* Lista de Cargos - Desktop */}
        <div className="hidden md:block">
          <CargosList
            cargos={cargos}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Accordion de Cargos - Mobile */}
        <div className="md:hidden">
          <CargoAccordion
            cargos={cargos}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Modal de Edição/Criação */}
        <EditRoleModal
          cargo={selectedCargo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          isCreating={isCreating}
        />
      </div>
    </DashboardLayout>
  );
}
