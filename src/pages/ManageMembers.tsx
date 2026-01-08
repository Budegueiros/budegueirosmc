import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Loader2, Download, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useManageMembers } from '../hooks/useManageMembers';
import { Membro } from '../types/database.types';
import MembersFilterBar, { FilterState } from '../components/membros/MembersFilterBar';
import MembersTable from '../components/membros/MembersTable';
import MembersMetricsCards from '../components/membros/MembersMetricsCards';
import Pagination from '../components/mensalidades/Pagination';
import EditMemberModal from '../components/membros/EditMemberModal';
import { exportarMembrosParaCSV, exportarMembrosParaPDF } from '../utils/membersExportHelpers';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

export default function ManageMembers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { toggleActive, toggleAdmin } = useManageMembers();
  const navigate = useNavigate();

  const [membros, setMembros] = useState<MembroWithCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    cargoId: null,
    status: 'all',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<MembroWithCargos | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    // Redirecionar se não for admin
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar todos os membros com seus cargos ativos
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            ativo,
            cargos (
              id,
              nome,
              tipo_cargo
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (membrosError) throw membrosError;

      // Transformar dados para incluir apenas cargos ativos
      const membrosTransformados = (membrosData || []).map((m: any) => ({
        ...m,
        cargos_ativos: m.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos) || [],
      }));

      setMembros(membrosTransformados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toastError('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar membros baseado nos filtros
  const membrosFiltrados = useMemo(() => {
    let filtered = [...membros];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.nome_guerra.toLowerCase().includes(searchLower) ||
          m.nome_completo.toLowerCase().includes(searchLower) ||
          (m.email && m.email.toLowerCase().includes(searchLower)) ||
          m.numero_carteira.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por cargo
    if (filters.cargoId) {
      filtered = filtered.filter(
        (m) =>
          m.cargos_ativos?.some((cargo) => cargo.id === filters.cargoId) || false
      );
    }

    // Filtro por status
    if (filters.status === 'ativo') {
      filtered = filtered.filter((m) => m.ativo);
    } else if (filters.status === 'inativo') {
      filtered = filtered.filter((m) => !m.ativo);
    }

    return filtered;
  }, [membros, filters]);

  // Paginação
  const totalPages = Math.ceil(membrosFiltrados.length / itemsPerPage);
  const paginatedMembros = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return membrosFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [membrosFiltrados, currentPage]);

  // Calcular métricas
  const metrics = useMemo(() => {
    return {
      totalIntegrantes: membros.length,
      brasionados: membros.filter((m) =>
        m.cargos_ativos?.some((cargo) => cargo.nome === 'Brasionado')
      ).length,
      prospects: membros.filter((m) =>
        m.cargos_ativos?.some((cargo) => cargo.nome === 'Prospect')
      ).length,
      inativos: membros.filter((m) => !m.ativo).length,
    };
  }, [membros]);

  const handleEdit = (membro: MembroWithCargos) => {
    setSelectedMember(membro);
    setIsModalOpen(true);
  };

  const handleToggleAtivo = async (membro: MembroWithCargos) => {
    try {
      const newStatus = await toggleActive(membro.id, membro.ativo);
      setMembros(
        membros.map((m) => (m.id === membro.id ? { ...m, ativo: newStatus } : m))
      );
      toastSuccess(
        `Membro ${newStatus ? 'ativado' : 'desativado'} com sucesso!`
      );
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastError('Erro ao alterar status do membro');
    }
  };

  const handleToggleAdmin = async (membro: MembroWithCargos) => {
    // Não permitir remover admin de si mesmo
    if (membro.user_id === user?.id && membro.is_admin) {
      toastWarning('Você não pode remover seus próprios privilégios de administrador');
      return;
    }

    try {
      const newStatus = await toggleAdmin(membro.id, membro.is_admin);
      setMembros(
        membros.map((m) => (m.id === membro.id ? { ...m, is_admin: newStatus } : m))
      );
      toastSuccess(
        `Privilégios de administrador ${newStatus ? 'concedidos' : 'removidos'} com sucesso!`
      );
    } catch (error) {
      console.error('Erro ao alterar admin:', error);
      toastError('Erro ao alterar privilégios de administrador');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleModalSuccess = () => {
    carregarDados();
  };

  const handleExportCSV = () => {
    const membrosExport = membrosFiltrados.map((m) => ({
      nome_guerra: m.nome_guerra,
      nome_completo: m.nome_completo,
      numero_carteira: m.numero_carteira,
      email: m.email,
      telefone: m.telefone,
      status_membro: m.status_membro,
      ativo: m.ativo,
      is_admin: m.is_admin,
      endereco_cidade: m.endereco_cidade,
      endereco_estado: m.endereco_estado,
      cargos: m.cargos_ativos?.map((c) => c.nome) || [],
    }));
    exportarMembrosParaCSV(membrosExport, 'integrantes');
  };

  const handleExportPDF = () => {
    const membrosExport = membrosFiltrados.map((m) => ({
      nome_guerra: m.nome_guerra,
      nome_completo: m.nome_completo,
      numero_carteira: m.numero_carteira,
      email: m.email,
      telefone: m.telefone,
      status_membro: m.status_membro,
      ativo: m.ativo,
      is_admin: m.is_admin,
      endereco_cidade: m.endereco_cidade,
      endereco_estado: m.endereco_estado,
      cargos: m.cargos_ativos?.map((c) => c.nome) || [],
    }));
    exportarMembrosParaPDF(membrosExport, 'Relatório de Integrantes');
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Gerenciar Integrantes
            </h1>
            <p className="text-gray-400">
              Gerencie os integrantes do clube, cargos e permissões
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/invite-member"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Link>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <MembersMetricsCards metrics={metrics} />

      {/* Filtros */}
      <MembersFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Tabela */}
      <MembersTable
        membros={paginatedMembros}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onEdit={handleEdit}
        onToggleActive={handleToggleAtivo}
        onToggleAdmin={handleToggleAdmin}
        currentUserId={user?.id}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={membrosFiltrados.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Edição */}
      <EditMemberModal
        membro={selectedMember}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
