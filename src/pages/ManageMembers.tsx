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

// Componentes Mobile
import MobileHeader from '../components/membros/mobile/MobileHeader';
import SearchBar from '../components/membros/mobile/SearchBar';
import StatsCarousel from '../components/membros/mobile/StatsCarousel';
import QuickFilters from '../components/membros/mobile/QuickFilters';
import MemberCard from '../components/membros/mobile/MemberCard';
import FilterDrawer, { FilterState as MobileFilterState } from '../components/membros/mobile/FilterDrawer';
import ActionSheet from '../components/membros/mobile/ActionSheet';
import FAB from '../components/membros/mobile/FAB';
import EmptyState from '../components/membros/mobile/EmptyState';
import LoadingSkeleton from '../components/membros/mobile/LoadingSkeleton';
import InfiniteScrollTrigger from '../components/membros/mobile/InfiniteScrollTrigger';
import { useMembersMobile } from '../hooks/useMembersMobile';

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

  // Estados para versão mobile
  const [mobileFilters, setMobileFilters] = useState<MobileFilterState>({
    status: 'todos',
    cargo: '',
    cidade: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedMemberForActions, setSelectedMemberForActions] = useState<MembroWithCargos | null>(null);
  const [cargos, setCargos] = useState<Array<{ id: string; nome: string }>>([]);

  // Hook mobile
  const {
    members: mobileMembers,
    stats: mobileStats,
    loading: mobileLoading,
    refetch: mobileRefetch,
    hasMore: mobileHasMore,
    loadMore: mobileLoadMore,
  } = useMembersMobile({
    searchQuery,
    filters: mobileFilters,
  });

  // Carregar cargos para filtros
  useEffect(() => {
    const carregarCargos = async () => {
      try {
        const { data, error } = await supabase
          .from('cargos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nivel', { ascending: true });

        if (error) throw error;
        setCargos(data || []);
      } catch (error) {
        console.error('Erro ao carregar cargos:', error);
      }
    };
    if (isAdmin) {
      carregarCargos();
    }
  }, [isAdmin]);

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

  // Handlers mobile
  const handleMobileView = (memberId: string) => {
    navigate(`/manage-members/${memberId}`);
  };

  const handleMobileEdit = (memberId: string) => {
    const member = mobileMembers.find((m) => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setIsModalOpen(true);
    }
  };

  const handleMobileMoreActions = (memberId: string) => {
    const member = mobileMembers.find((m) => m.id === memberId);
    if (member) {
      setSelectedMemberForActions(member);
      setActionSheetVisible(true);
    }
  };

  const handleMobileRemove = async (memberId: string) => {
    const member = mobileMembers.find((m) => m.id === memberId);
    if (member) {
      await handleToggleAtivo(member);
      mobileRefetch();
    }
  };

  const handleMobileStatPress = (filter: 'todos' | 'brasionado' | 'prospect' | 'inativo') => {
    setMobileFilters({ ...mobileFilters, status: filter });
  };

  const handleMobileFilterChange = (key: 'status' | 'cargo', value: string) => {
    setMobileFilters({ ...mobileFilters, [key]: value });
  };

  const handleMobileFilterApply = (newFilters: MobileFilterState) => {
    setMobileFilters(newFilters);
  };

  const handleClearMobileFilters = () => {
    setSearchQuery('');
    setMobileFilters({
      status: 'todos',
      cargo: '',
      cidade: '',
    });
  };

  return (
    <>
      {/* Versão Mobile */}
      <div className="lg:hidden min-h-screen bg-gray-900 pb-24">
        <MobileHeader title="Gerenciar Integrantes" />

        <SearchBar
          onSearch={setSearchQuery}
          onFilterPress={() => setFilterDrawerVisible(true)}
        />

        <StatsCarousel stats={mobileStats} onStatPress={handleMobileStatPress} />

        <QuickFilters
          filters={mobileFilters}
          activeFilters={mobileFilters}
          onFilterChange={handleMobileFilterChange}
          stats={mobileStats}
        />

        {mobileLoading ? (
          <LoadingSkeleton />
        ) : mobileMembers.length === 0 ? (
          <EmptyState onClearFilters={handleClearMobileFilters} />
        ) : (
          <div className="py-3">
            {mobileMembers.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                onView={handleMobileView}
                onEdit={handleMobileEdit}
                onMoreActions={handleMobileMoreActions}
              />
            ))}
            <InfiniteScrollTrigger
              onLoadMore={mobileLoadMore}
              hasMore={mobileHasMore}
              loading={mobileLoading}
            />
          </div>
        )}

        <FAB to="/invite-member" />

        <FilterDrawer
          visible={filterDrawerVisible}
          onClose={() => setFilterDrawerVisible(false)}
          onApply={handleMobileFilterApply}
          initialFilters={mobileFilters}
          cargos={cargos}
        />

        {selectedMemberForActions && (
          <ActionSheet
            visible={actionSheetVisible}
            onClose={() => {
              setActionSheetVisible(false);
              setSelectedMemberForActions(null);
            }}
            memberId={selectedMemberForActions.id}
            memberName={selectedMemberForActions.nome_guerra}
            onRemove={handleMobileRemove}
          />
        )}

        <EditMemberModal
          membro={selectedMember}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMember(null);
          }}
          onSuccess={() => {
            carregarDados();
            mobileRefetch();
          }}
        />
      </div>

      {/* Versão Desktop */}
      <div className="hidden lg:block min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Painel Administrativo
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
    </>
  );
}
