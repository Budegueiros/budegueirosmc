import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { useManageMembers } from '../hooks/useManageMembers';
import { Membro } from '../types/database.types';
import MembersFilterBar, { FilterState } from '../components/membros/MembersFilterBar';
import MembersTable from '../components/membros/MembersTable';
import MemberCardCompact from '../components/membros/MemberCardCompact';
import EditMemberModal from '../components/membros/EditMemberModal';

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
  const [selectedMember, setSelectedMember] = useState<MembroWithCargos | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          m.email.toLowerCase().includes(searchLower) ||
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

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D32F2F] animate-spin mx-auto mb-4" />
          <p className="text-[#B0B0B0] font-oswald uppercase text-sm tracking-wider">
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
    <div className="min-h-screen bg-[#121212] pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-[#D32F2F] flex-shrink-0" />
                <h1 className="text-[#D32F2F] font-oswald text-2xl sm:text-3xl md:text-4xl uppercase font-bold break-words">
                  Gerenciar Integrantes
                </h1>
              </div>
              <p className="text-[#B0B0B0] text-sm">
                Gerencie os integrantes do clube, cargos e permissões
              </p>
            </div>

            <Link
              to="/invite-member"
              className="flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <MembersFilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Lista de Integrantes - Desktop (Tabela) */}
        <div className="hidden md:block">
          <MembersTable
            membros={membrosFiltrados}
            onEdit={handleEdit}
            onToggleActive={handleToggleAtivo}
            onToggleAdmin={handleToggleAdmin}
            currentUserId={user?.id}
          />
        </div>

        {/* Lista de Integrantes - Mobile (Cards Compactos) */}
        <div className="md:hidden space-y-3">
          {membrosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg">
              <Users className="w-12 h-12 text-[#B0B0B0] mx-auto mb-4" />
              <p className="text-[#B0B0B0] font-oswald uppercase">
                {filters.search || filters.cargoId || filters.status !== 'all'
                  ? 'Nenhum membro encontrado'
                  : 'Nenhum membro cadastrado'}
              </p>
            </div>
          ) : (
            membrosFiltrados.map((membro) => (
              <MemberCardCompact
                key={membro.id}
                membro={membro}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

        {/* Modal de Edição */}
        <EditMemberModal
          membro={selectedMember}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
}
