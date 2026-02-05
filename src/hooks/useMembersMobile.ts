import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Membro } from '../types/database.types';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface UseMembersMobileProps {
  searchQuery: string;
  filters: {
    status: string;
    cargo: string;
    cidade: string;
  };
}

interface UseMembersMobileReturn {
  members: MembroWithCargos[];
  stats: {
    totalIntegrantes: number;
    brasionados: number;
    prospects: number;
    inativos: number;
  };
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

const CACHE_KEY = 'budegueiros_members_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos
const ITEMS_PER_PAGE = 20;

interface CacheData {
  members: MembroWithCargos[];
  timestamp: number;
}

export function useMembersMobile({
  searchQuery,
  filters,
}: UseMembersMobileProps): UseMembersMobileReturn {
  const [allMembersData, setAllMembersData] = useState<MembroWithCargos[]>([]);
  const [displayedMembers, setDisplayedMembers] = useState<MembroWithCargos[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função para obter dados do cache
  const getCachedData = (): MembroWithCargos[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      const now = Date.now();

      // Verificar se o cache ainda é válido
      if (now - cacheData.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cacheData.members;
    } catch (err) {
      console.error('Erro ao ler cache:', err);
      return null;
    }
  };

  // Função para salvar dados no cache
  const setCachedData = (members: MembroWithCargos[]) => {
    try {
      const cacheData: CacheData = {
        members,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  };

  const fetchMembers = async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      // Tentar usar cache primeiro
      if (useCache) {
        const cachedMembers = getCachedData();
        if (cachedMembers) {
          setAllMembersData(cachedMembers);
          setLoading(false);
          return;
        }
      }

      // Buscar todos os membros com seus cargos
      const { data, error: queryError } = await supabase
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
        .order('nome_guerra', { ascending: true });

      if (queryError) throw queryError;

      // Transformar dados para incluir apenas cargos ativos
      const membrosTransformados = (data || []).map((m: any) => ({
        ...m,
        cargos_ativos: m.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos) || [],
      }));

      // Salvar no cache
      setCachedData(membrosTransformados);
      setAllMembersData(membrosTransformados);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao buscar membros');
      setError(error);
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para aplicar filtros
  const applyFilters = useMemo(() => {
    return (members: MembroWithCargos[]) => {
      let filtered = [...members];

      // Aplicar filtros no cliente
      // Filtro de busca
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.nome_guerra.toLowerCase().includes(searchLower) ||
            m.nome_completo.toLowerCase().includes(searchLower) ||
            m.numero_carteira.toLowerCase().includes(searchLower) ||
            (m.email && m.email.toLowerCase().includes(searchLower))
        );
      }

      // Filtro de status
      if (filters.status && filters.status !== 'todos') {
        if (filters.status === 'brasionado') {
          filtered = filtered.filter((m) =>
            m.cargos_ativos?.some((cargo: any) => cargo.nome === 'Brasionado')
          );
        } else if (filters.status === 'prospect') {
          filtered = filtered.filter((m) => m.status_membro === 'Prospect');
        } else if (filters.status === 'inativo') {
          filtered = filtered.filter((m) => !m.ativo);
        }
      }

      // Filtro de cargo
      if (filters.cargo) {
        filtered = filtered.filter((m) =>
          m.cargos_ativos?.some((cargo: any) => cargo.id === filters.cargo)
        );
      }

      // Filtro de cidade
      if (filters.cidade) {
        const cidadeLower = filters.cidade.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.endereco_cidade?.toLowerCase().includes(cidadeLower) ||
            m.endereco_estado?.toLowerCase().includes(cidadeLower)
        );
      }

      return filtered;
    };
  }, [searchQuery, filters.status, filters.cargo, filters.cidade]);

  const fetchStats = async () => {
    try {
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select(`
          id,
          status_membro,
          ativo,
          membro_cargos (
            id,
            ativo,
            cargos (
              id,
              nome
            )
          )
        `);

      if (membrosError) throw membrosError;

      const stats = {
        totalIntegrantes: membrosData?.length || 0,
        brasionados:
          membrosData?.filter((m: any) =>
            m.membro_cargos?.some(
              (mc: any) => mc.ativo && mc.cargos?.nome === 'Brasionado'
            )
          ).length || 0,
        prospects:
          membrosData?.filter((m: any) => m.status_membro === 'Prospect')
            .length || 0,
        inativos: membrosData?.filter((m: any) => !m.ativo).length || 0,
      };

      return stats;
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return {
        totalIntegrantes: 0,
        brasionados: 0,
        prospects: 0,
        inativos: 0,
      };
    }
  };

  // Buscar estatísticas de todos os membros (não filtrados)
  const [allMembers, setAllMembers] = useState<MembroWithCargos[]>([]);

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        const { data, error } = await supabase
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
          `);

        if (error) throw error;

        const membrosTransformados = (data || []).map((m: any) => ({
          ...m,
          cargos_ativos: m.membro_cargos
            ?.filter((mc: any) => mc.cargos && mc.ativo)
            .map((mc: any) => mc.cargos) || [],
        }));

        setAllMembers(membrosTransformados);
      } catch (err) {
        console.error('Erro ao buscar todos os membros para estatísticas:', err);
      }
    };

    fetchAllMembers();
  }, []);

  const stats = useMemo(() => {
    return {
      totalIntegrantes: allMembers.length,
      brasionados: allMembers.filter((m) =>
        m.cargos_ativos?.some((cargo) => cargo.nome === 'Brasionado')
      ).length,
      prospects: allMembers.filter((m) => m.status_membro === 'Prospect').length,
      inativos: allMembers.filter((m) => !m.ativo).length,
    };
  }, [allMembers]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.status, filters.cargo, filters.cidade]);

  // Aplicar filtros e paginação quando dados ou filtros mudarem
  useEffect(() => {
    if (allMembersData.length > 0) {
      const filtered = applyFilters(allMembersData);
      const endIndex = currentPage * ITEMS_PER_PAGE;
      setDisplayedMembers(filtered.slice(0, endIndex));
    }
  }, [allMembersData, applyFilters, currentPage]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchMembers(true);
  }, []);

  const refetch = () => {
    fetchMembers(false); // Forçar atualização sem cache
  };

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Calcular se há mais itens para carregar
  const hasMore = useMemo(() => {
    if (allMembersData.length === 0) return false;
    const filtered = applyFilters(allMembersData);
    return displayedMembers.length < filtered.length;
  }, [allMembersData, displayedMembers.length, applyFilters]);

  return {
    members: displayedMembers,
    stats,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}

