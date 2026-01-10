import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Download, FileDown, X, Save, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { compressImage, isValidImageFile } from '../utils/imageCompression';
import EventsMetricsCards from '../components/eventos/EventsMetricsCards';
import EventsFilterBar from '../components/eventos/EventsFilterBar';
import EventsTable from '../components/eventos/EventsTable';
import Pagination from '../components/mensalidades/Pagination';
import { exportarEventosParaCSV, exportarEventosParaPDF } from '../utils/exportHelpers';
// Mobile Components
import EventosHeader from '../components/eventos/mobile/EventosHeader';
import EventosSummary from '../components/eventos/mobile/EventosSummary';
import SearchBar from '../components/eventos/mobile/SearchBar';
import EventosFilters from '../components/eventos/mobile/EventosFilters';
import EventSectionHeader from '../components/eventos/mobile/EventSectionHeader';
import EventCard from '../components/eventos/mobile/EventCard';
import FAB from '../components/eventos/mobile/FAB';
import ActionSheet from '../components/eventos/mobile/ActionSheet';
import { useEvents } from '../hooks/useEvents';

interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  cidade: string;
  estado: string;
  distancia_km: number | null;
  tipo_evento: string;
  status: string;
  vagas_limitadas: boolean;
  max_participantes: number | null;
  foto_capa_url: string | null;
  observacoes: string | null;
  evento_principal: boolean;
  created_at: string;
}

interface EditingEvento {
  nome: string;
  descricao: string;
  data_evento: string;
  hora_saida: string;
  local_saida: string;
  local_destino: string;
  cidade: string;
  estado: string;
  distancia_km: string;
  tipo_evento: string;
  status: string;
  vagas_limitadas: boolean;
  max_participantes: string;
  observacoes: string;
  evento_principal: boolean;
}

export default function ManageEvents() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    tipo: 'todos'
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingEvento | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteNome, setDeleteNome] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [participacoesEventoId, setParticipacoesEventoId] = useState<string | null>(null);
  const [participacoesModalOpen, setParticipacoesModalOpen] = useState(false);
  // Mobile states
  const [mobileSearch, setMobileSearch] = useState('');
  const [mobileStatusFilter, setMobileStatusFilter] = useState('todos');
  const [mobileTipoFilter, setMobileTipoFilter] = useState('todos');
  const [actionSheetEvento, setActionSheetEvento] = useState<string | null>(null);
  
  // Hook para buscar eventos com participantes
  const { eventosComConfirmados, refresh: refreshEventos } = useEvents(user?.id);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarEventos();
      refreshEventos(); // Atualizar eventos com participantes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const carregarEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('data_evento', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toastError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos
  const filteredEventos = useMemo(() => {
    return eventos.filter(e => {
      const matchSearch = 
        e.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.cidade.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.tipo_evento.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchStatus = filters.status === 'todos' || e.status === filters.status;
      const matchTipo = filters.tipo === 'todos' || e.tipo_evento === filters.tipo;
      
      return matchSearch && matchStatus && matchTipo;
    });
  }, [eventos, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredEventos.length / itemsPerPage);
  const paginatedEventos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEventos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEventos, currentPage]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const eventosAtivos = eventos.filter(e => e.status === 'Ativo');
    const eventosFinalizados = eventos.filter(e => e.status === 'Finalizado');
    
    // Encontrar próximo evento (mais próximo no futuro)
    const eventosFuturos = eventos
      .filter(e => {
        const dataEvento = new Date(e.data_evento + 'T00:00:00');
        dataEvento.setHours(0, 0, 0, 0);
        return dataEvento >= hoje && e.status === 'Ativo';
      })
      .sort((a, b) => {
        const dataA = new Date(a.data_evento + 'T00:00:00').getTime();
        const dataB = new Date(b.data_evento + 'T00:00:00').getTime();
        return dataA - dataB;
      });

    const proximoEvento = eventosFuturos.length > 0 
      ? eventosFuturos[0] 
      : null;

    return {
      totalEventos: eventos.length,
      eventosAtivos: eventosAtivos.length,
      eventosFinalizados: eventosFinalizados.length,
      proximoEvento: proximoEvento?.nome || null,
      proximoEventoData: proximoEvento?.data_evento || null,
      proximoEventoHora: proximoEvento?.hora_saida || null
    };
  }, [eventos]);

  // Filtrar eventos mobile
  const mobileFilteredEventos = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return eventosComConfirmados.filter(e => {
      const matchSearch = 
        !mobileSearch ||
        e.nome.toLowerCase().includes(mobileSearch.toLowerCase()) ||
        e.cidade.toLowerCase().includes(mobileSearch.toLowerCase()) ||
        e.tipo_evento.toLowerCase().includes(mobileSearch.toLowerCase());
      
      const matchStatus = mobileStatusFilter === 'todos' || e.status === mobileStatusFilter;
      const matchTipo = mobileTipoFilter === 'todos' || e.tipo_evento === mobileTipoFilter;
      
      return matchSearch && matchStatus && matchTipo;
    }).map(e => {
      const dataEvento = new Date(e.data_evento + 'T00:00:00');
      dataEvento.setHours(0, 0, 0, 0);
      return {
        ...e,
        isFuturo: dataEvento >= hoje
      };
    });
  }, [eventosComConfirmados, mobileSearch, mobileStatusFilter, mobileTipoFilter]);

  // Separar eventos por categoria (próximos vs passados)
  const eventosProximos = useMemo(() => 
    mobileFilteredEventos
      .filter(e => e.isFuturo && e.status === 'Ativo')
      .sort((a, b) => {
        const dataA = new Date(a.data_evento + 'T00:00:00').getTime();
        const dataB = new Date(b.data_evento + 'T00:00:00').getTime();
        return dataA - dataB;
      }),
    [mobileFilteredEventos]
  );

  const eventosPassados = useMemo(() => 
    mobileFilteredEventos
      .filter(e => !e.isFuturo || e.status === 'Finalizado')
      .sort((a, b) => {
        const dataA = new Date(a.data_evento + 'T00:00:00').getTime();
        const dataB = new Date(b.data_evento + 'T00:00:00').getTime();
        return dataB - dataA; // Mais recentes primeiro
      }),
    [mobileFilteredEventos]
  );

  // Contar eventos por tipo para filtros
  const eventosCounts = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const eventosFiltrados = eventosComConfirmados.filter(e => {
      const matchSearch = 
        !mobileSearch ||
        e.nome.toLowerCase().includes(mobileSearch.toLowerCase()) ||
        e.cidade.toLowerCase().includes(mobileSearch.toLowerCase()) ||
        e.tipo_evento.toLowerCase().includes(mobileSearch.toLowerCase());
      
      const matchStatus = mobileStatusFilter === 'todos' || e.status === mobileStatusFilter;
      return matchSearch && matchStatus;
    });

    return {
      todos: eventosFiltrados.length,
      roles: eventosFiltrados.filter(e => e.tipo_evento === 'Role').length,
      encontros: eventosFiltrados.filter(e => e.tipo_evento === 'Encontro').length
    };
  }, [eventosComConfirmados, mobileSearch, mobileStatusFilter]);

  // Função para confirmar presença
  const handleConfirmarPresenca = async (eventoId: string) => {
    if (!user) return;

    try {
      // Buscar membro
      const { data: membroData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membroData) {
        toastError('Erro ao identificar membro');
        return;
      }

      // Verificar se já confirmou
      const { data: confirmacaoExistente } = await supabase
        .from('confirmacoes_presenca')
        .select('id, status')
        .eq('evento_id', eventoId)
        .eq('membro_id', membroData.id)
        .single();

      if (confirmacaoExistente) {
        // Atualizar status
        const novoStatus = confirmacaoExistente.status === 'Confirmado' 
          ? 'Cancelado' 
          : 'Confirmado';

        const { error } = await supabase
          .from('confirmacoes_presenca')
          .update({ status: novoStatus })
          .eq('id', confirmacaoExistente.id);

        if (error) throw error;

        toastSuccess(novoStatus === 'Confirmado' 
          ? 'Presença confirmada!' 
          : 'Presença cancelada.');
      } else {
        // Criar confirmação
        const { error } = await supabase
          .from('confirmacoes_presenca')
          .insert({
            evento_id: eventoId,
            membro_id: membroData.id,
            status: 'Confirmado'
          });

        if (error) throw error;
        toastSuccess('Presença confirmada!');
      }

      await refreshEventos();
      await carregarEventos(); // Atualizar lista completa
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      toastError('Erro ao confirmar presença');
    }
  };

  const handleEditEvento = (eventoId: string) => {
    // Procurar em eventos primeiro, depois em eventosComConfirmados para mobile
    const eventoCompleto = eventos.find(e => e.id === eventoId) || 
      eventosComConfirmados.find(e => e.id === eventoId);
    
    if (!eventoCompleto) {
      console.error('Evento não encontrado:', eventoId);
      return;
    }

    // Garantir que temos todas as propriedades necessárias
    const evento = 'descricao' in eventoCompleto 
      ? eventoCompleto 
      : eventos.find(e => e.id === eventoId) || eventoCompleto;

    setEditingId(evento.id);
    setEditingData({
      nome: evento.nome,
      descricao: ('descricao' in evento ? evento.descricao : null) || '',
      data_evento: evento.data_evento,
      hora_saida: evento.hora_saida || '',
      local_saida: evento.local_saida,
      local_destino: evento.local_destino || '',
      cidade: evento.cidade,
      estado: evento.estado,
      distancia_km: ('distancia_km' in evento ? evento.distancia_km : null)?.toString() || '',
      tipo_evento: evento.tipo_evento,
      status: evento.status,
      vagas_limitadas: evento.vagas_limitadas,
      max_participantes: evento.max_participantes?.toString() || '',
      observacoes: ('observacoes' in evento ? evento.observacoes : null) || '',
      evento_principal: ('evento_principal' in evento ? evento.evento_principal : false),
    });
    setSelectedFile(null);
    setPreviewUrl(('foto_capa_url' in evento ? evento.foto_capa_url : null) || null);
    setGaleriaFiles([]);
    setGaleriaPreviews([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      toastWarning('Por favor, selecione uma imagem válida (JPG, PNG ou WEBP)');
      return;
    }

    try {
      const compressedFile = await compressImage(file, 5);

      setSelectedFile(compressedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toastError('Erro ao processar imagem. Tente novamente.');
    }
  };

  const uploadFotoCapa = async (eventoId: string): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    try {
      const evento = eventos.find(e => e.id === eventoId);
      if (evento?.foto_capa_url) {
        const oldPath = evento.foto_capa_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`eventos/${oldPath}`]);
        }
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `eventos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toastError('Erro ao fazer upload da foto de capa');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleGaleriaFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (!isValidImageFile(file)) {
        toastWarning(`Arquivo ${file.name} não é uma imagem válida`);
        continue;
      }

      try {
        const compressedFile = await compressImage(file, 5);
        validFiles.push(compressedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === validFiles.length) {
            setGaleriaPreviews(prev => [...prev, ...previews]);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
      }
    }

    setGaleriaFiles(prev => [...prev, ...validFiles]);
  };

  const removeGaleriaFile = (index: number) => {
    setGaleriaFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFotosGaleria = async (eventoId: string) => {
    if (galeriaFiles.length === 0) return;

    try {
      for (let i = 0; i < galeriaFiles.length; i++) {
        const file = galeriaFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `eventos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('evento_fotos')
          .insert({
            evento_id: eventoId,
            foto_url: urlData.publicUrl,
            ordem: i + 1,
            ativo: true
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Erro ao fazer upload das fotos da galeria:', error);
      toastError('Erro ao fazer upload de algumas fotos da galeria');
    }
  };

  const handleSaveEvento = async (eventoId: string) => {
    if (!editingData) return;
    
    setSaving(true);
    try {
      let foto_capa_url = null;
      if (selectedFile) {
        foto_capa_url = await uploadFotoCapa(eventoId);
      }

      const updateData: any = {
        nome: editingData.nome,
        descricao: editingData.descricao || null,
        data_evento: editingData.data_evento,
        hora_saida: editingData.hora_saida || null,
        local_saida: editingData.local_saida,
        local_destino: editingData.local_destino || null,
        cidade: editingData.cidade,
        estado: editingData.estado,
        distancia_km: editingData.distancia_km ? parseInt(editingData.distancia_km) : null,
        tipo_evento: editingData.tipo_evento,
        status: editingData.status,
        vagas_limitadas: editingData.vagas_limitadas,
        max_participantes: editingData.vagas_limitadas && editingData.max_participantes 
          ? parseInt(editingData.max_participantes) 
          : null,
        observacoes: editingData.observacoes || null,
        evento_principal: editingData.evento_principal,
      };

      if (foto_capa_url) {
        updateData.foto_capa_url = foto_capa_url;
      }

      const { error } = await supabase
        .from('eventos')
        .update(updateData)
        .eq('id', eventoId);

      if (error) throw error;

      if (galeriaFiles.length > 0 && editingData.evento_principal) {
        await uploadFotosGaleria(eventoId);
      }

      await carregarEventos();
      await refreshEventos();
      setEditingId(null);
      setEditingData(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setGaleriaFiles([]);
      setGaleriaPreviews([]);
      toastSuccess('Evento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toastError('Erro ao salvar evento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setGaleriaFiles([]);
    setGaleriaPreviews([]);
  };

  const handleDeleteEvento = (eventoId: string, eventoNome: string) => {
    setDeleteId(eventoId);
    setDeleteNome(eventoNome);
  };

  const executeDeleteEvento = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setEventos(eventos.filter(e => e.id !== deleteId));
      await refreshEventos();
      setDeleteId(null);
      setDeleteNome('');
      toastSuccess('Evento deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toastError('Erro ao deletar evento');
      setDeleteId(null);
      setDeleteNome('');
    }
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
    <>
      {/* Versão Mobile */}
      <div className="lg:hidden min-h-screen bg-gray-900 pb-24">
        <EventosHeader />

        <EventosSummary metrics={metrics} />

        <SearchBar
          value={mobileSearch}
          onChange={setMobileSearch}
        />

        <EventosFilters
          statusFilter={mobileStatusFilter}
          tipoFilter={mobileTipoFilter}
          onStatusChange={setMobileStatusFilter}
          onTipoChange={setMobileTipoFilter}
          eventosCounts={eventosCounts}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : mobileFilteredEventos.length === 0 ? (
          <div className="mx-4 mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Nenhum evento encontrado</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="py-3">
            {/* Próximos Eventos */}
            {eventosProximos.length > 0 && (
              <>
                <EventSectionHeader icon="📅" title="Próximos Eventos" />
                {eventosProximos.map((evento, index) => (
                  <EventCard
                    key={evento.id}
                    evento={evento}
                    confirmados={evento.confirmados}
                    totalMembros={evento.totalMembros}
                    usuarioConfirmou={evento.usuarioConfirmou}
                    onConfirmar={() => handleConfirmarPresenca(evento.id)}
                    onVer={() => handleEditEvento(evento.id)}
                    onMore={() => setActionSheetEvento(evento.id)}
                    index={index}
                  />
                ))}
              </>
            )}

            {/* Eventos Passados */}
            {eventosPassados.length > 0 && (
              <>
                <EventSectionHeader icon="📂" title="Eventos Passados" />
                {eventosPassados.map((evento, index) => (
                  <EventCard
                    key={evento.id}
                    evento={evento}
                    confirmados={evento.confirmados}
                    totalMembros={evento.totalMembros}
                    usuarioConfirmou={evento.usuarioConfirmou}
                    onVer={() => handleEditEvento(evento.id)}
                    onMore={() => setActionSheetEvento(evento.id)}
                    onRelatorio={() => {
                      // Implementar relatório se necessário
                    }}
                    index={index}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <FAB to="/create-event" />

        {/* Action Sheet */}
        {actionSheetEvento && (
          <ActionSheet
            visible={!!actionSheetEvento}
            onClose={() => setActionSheetEvento(null)}
            onEdit={() => {
              if (actionSheetEvento) {
                handleEditEvento(actionSheetEvento);
                setActionSheetEvento(null); // Fechar ActionSheet após ação
              }
            }}
            onDelete={() => {
              if (actionSheetEvento) {
                // Procurar em ambos os arrays
                const evento = eventos.find(e => e.id === actionSheetEvento) || 
                              eventosComConfirmados.find(e => e.id === actionSheetEvento);
                if (evento) {
                  handleDeleteEvento(actionSheetEvento, evento.nome);
                }
              }
            }}
            onManageParticipacoes={() => {
              if (actionSheetEvento) {
                setParticipacoesEventoId(actionSheetEvento);
                setParticipacoesModalOpen(true);
                setActionSheetEvento(null); // Fechar ActionSheet após ação
              }
            }}
          />
        )}
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
              Gerenciar Eventos
            </h1>
            <p className="text-gray-400">
              Gerencie todos os eventos e roles do clube
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/create-event"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Criar Evento
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => exportarEventosParaCSV(filteredEventos, 'eventos')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => exportarEventosParaPDF(filteredEventos, 'Relatório de Eventos')}
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
      <EventsMetricsCards metrics={metrics} />

      {/* Filtros */}
      <EventsFilterBar filters={filters} setFilters={setFilters} />

      {/* Tabela */}
      <EventsTable
        eventos={paginatedEventos}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onDelete={handleDeleteEvento}
        onEdit={handleEditEvento}
        onManageParticipacoes={(eventoId) => {
          setParticipacoesEventoId(eventoId);
          setParticipacoesModalOpen(true);
        }}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEventos.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
      </div>

      {/* Modais Compartilhados (Mobile e Desktop) */}
      {/* Modal de Edição */}
      {editingId && editingData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">Editar Evento</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome do Evento</label>
                <input
                  type="text"
                  value={editingData.nome}
                  onChange={(e) => setEditingData({ ...editingData, nome: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              {/* Upload de Foto de Capa */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-2">Foto de Capa</label>
                <div className="flex items-center gap-4">
                  {previewUrl && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-700">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-gray-600 transition text-center">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        {uploading ? 'Enviando...' : 'Clique para escolher uma foto'}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">Máx 5MB • JPG, PNG ou WEBP</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading || saving}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Descrição</label>
                <textarea
                  value={editingData.descricao}
                  onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  rows={3}
                  disabled={saving}
                  placeholder="Descrição do evento..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Tipo</label>
                <select
                  value={editingData.tipo_evento}
                  onChange={(e) => setEditingData({ ...editingData, tipo_evento: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="Role">Role</option>
                  <option value="Encontro">Encontro</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Confraternização">Confraternização</option>
                  <option value="Aniversário">Aniversário</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={editingData.status}
                  onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data</label>
                <input
                  type="date"
                  value={editingData.data_evento}
                  onChange={(e) => setEditingData({ ...editingData, data_evento: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Hora de Saída</label>
                <input
                  type="time"
                  value={editingData.hora_saida}
                  onChange={(e) => setEditingData({ ...editingData, hora_saida: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Local de Saída</label>
                <input
                  type="text"
                  value={editingData.local_saida}
                  onChange={(e) => setEditingData({ ...editingData, local_saida: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Local de Destino</label>
                <input
                  type="text"
                  value={editingData.local_destino}
                  onChange={(e) => setEditingData({ ...editingData, local_destino: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Cidade</label>
                <input
                  type="text"
                  value={editingData.cidade}
                  onChange={(e) => setEditingData({ ...editingData, cidade: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Estado</label>
                <select
                  value={editingData.estado}
                  onChange={(e) => setEditingData({ ...editingData, estado: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                >
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="RS">Rio Grande do Sul</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Distância (KM)</label>
                <input
                  type="number"
                  value={editingData.distancia_km}
                  onChange={(e) => setEditingData({ ...editingData, distancia_km: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-xs uppercase mb-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.vagas_limitadas}
                    onChange={(e) => setEditingData({ ...editingData, vagas_limitadas: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                    disabled={saving}
                  />
                  Limitar Vagas
                </label>
                {editingData.vagas_limitadas && (
                  <input
                    type="number"
                    value={editingData.max_participantes}
                    onChange={(e) => setEditingData({ ...editingData, max_participantes: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600 mt-2"
                    placeholder="Máximo de participantes"
                    disabled={saving}
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-xs uppercase mb-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.evento_principal}
                    onChange={(e) => setEditingData({ ...editingData, evento_principal: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                    disabled={saving}
                  />
                  Evento Principal (Exibir na página pública)
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Eventos principais são exibidos na página "Eventos Realizados" do site
                </p>
              </div>

              {/* Upload de Fotos da Galeria (apenas para eventos principais) */}
              {editingData.evento_principal && (
                <div className="md:col-span-2">
                  <label className="block text-gray-400 text-xs uppercase mb-2">
                    Galeria de Fotos (Múltiplas)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGaleriaFilesChange}
                    className="hidden"
                    id={`galeria-upload-${editingId}`}
                    disabled={saving}
                  />
                  <label
                    htmlFor={`galeria-upload-${editingId}`}
                    className="cursor-pointer bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600/20 text-white px-4 py-2 rounded text-sm flex items-center gap-2 justify-center transition"
                  >
                    <Upload className="w-4 h-4" />
                    Adicionar Fotos à Galeria
                  </label>
                  
                  {galeriaPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {galeriaPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeGaleriaFile(index)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {galeriaFiles.length} foto(s) selecionada(s)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveEvento(editingId)}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Excluir Evento */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja deletar o evento <strong>"{deleteNome}"</strong>?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteNome('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteEvento}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <X className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Participações */}
      <ManageParticipacoesModal
        isOpen={participacoesModalOpen}
        eventoId={participacoesEventoId}
        onClose={() => {
          setParticipacoesModalOpen(false);
          setParticipacoesEventoId(null);
        }}
        onSave={() => {
          setParticipacoesModalOpen(false);
          setParticipacoesEventoId(null);
          carregarEventos();
          refreshEventos();
        }}
      />
    </>
  );
}

// Componente Modal para Gerenciar Participações
interface ManageParticipacoesModalProps {
  isOpen: boolean;
  eventoId: string | null;
  onClose: () => void;
  onSave: () => void;
}

function ManageParticipacoesModal({ isOpen, eventoId, onClose, onSave }: ManageParticipacoesModalProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [membros, setMembros] = useState<Array<{ id: string; nome_guerra: string; nome_completo: string }>>([]);
  const [participacoesConfirmadas, setParticipacoesConfirmadas] = useState<Set<string>>(new Set());
  const [confirmacoesPresenca, setConfirmacoesPresenca] = useState<Set<string>>(new Set());
  const [adminMembroId, setAdminMembroId] = useState<string | null>(null);
  const [searchMembro, setSearchMembro] = useState<string>('');

  useEffect(() => {
    if (isOpen && eventoId) {
      carregarDados();
    }
  }, [isOpen, eventoId]);

  const carregarDados = async () => {
    if (!eventoId || !user) return;

    setLoading(true);
    try {
      // Buscar dados do evento
      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (eventoError) throw eventoError;
      setEvento(eventoData);

      // Buscar membro admin atual
      const { data: adminData } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (adminData) {
        setAdminMembroId(adminData.id);
      }

      // Buscar todos os membros ativos
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('id, nome_guerra, nome_completo')
        .eq('ativo', true)
        .order('nome_guerra', { ascending: true });

      if (membrosError) throw membrosError;
      setMembros(membrosData || []);

      // Buscar confirmações de presença (para mostrar quem confirmou)
      const { data: confirmacoesData } = await supabase
        .from('confirmacoes_presenca')
        .select('membro_id')
        .eq('evento_id', eventoId)
        .eq('status', 'Confirmado');

      const confirmacoesSet = new Set((confirmacoesData || []).map(c => c.membro_id));
      setConfirmacoesPresenca(confirmacoesSet);

      // Buscar participações já confirmadas pelo admin
      const { data: participacoesData } = await supabase
        .from('participacoes_eventos')
        .select('membro_id')
        .eq('evento_id', eventoId);

      const participacoesSet = new Set((participacoesData || []).map(p => p.membro_id));
      setParticipacoesConfirmadas(participacoesSet);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toastError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipacao = (membroId: string) => {
    setParticipacoesConfirmadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(membroId)) {
        newSet.delete(membroId);
      } else {
        newSet.add(membroId);
      }
      return newSet;
    });
  };

  const handleSalvarParticipacoes = async () => {
    if (!eventoId || !adminMembroId) {
      toastError('Erro ao identificar admin');
      return;
    }

    setSaving(true);
    try {
      // Buscar participações atuais
      const { data: participacoesAtuais } = await supabase
        .from('participacoes_eventos')
        .select('membro_id')
        .eq('evento_id', eventoId);

      const idsAtuais = new Set((participacoesAtuais || []).map(p => p.membro_id));
      const idsNovos = new Set(participacoesConfirmadas);

      // Identificar o que precisa ser adicionado
      const paraAdicionar = Array.from(idsNovos).filter(id => !idsAtuais.has(id));
      
      // Identificar o que precisa ser removido
      const paraRemover = Array.from(idsAtuais).filter(id => !idsNovos.has(id));

      // Remover participações
      if (paraRemover.length > 0) {
        const { error: deleteError } = await supabase
          .from('participacoes_eventos')
          .delete()
          .eq('evento_id', eventoId)
          .in('membro_id', paraRemover);

        if (deleteError) throw deleteError;
      }

      // Adicionar novas participações
      if (paraAdicionar.length > 0) {
        const novasParticipacoes = paraAdicionar.map(membroId => ({
          evento_id: eventoId,
          membro_id: membroId,
          confirmado_por: adminMembroId
        }));

        const { error: insertError } = await supabase
          .from('participacoes_eventos')
          .insert(novasParticipacoes);

        if (insertError) throw insertError;
      }

      toastSuccess('Participações atualizadas com sucesso!');
      onSave();
    } catch (error) {
      console.error('Erro ao salvar participações:', error);
      toastError('Erro ao salvar participações');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !eventoId) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white text-xl font-bold">Gerenciar Participações</h3>
            {evento && (
              <p className="text-gray-400 text-sm mt-1">{evento.nome} - {new Date(evento.data_evento).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-blue-950/30 border border-blue-800/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Instrução:</strong> Marque os membros que realmente participaram deste evento. 
                O cálculo de KM anual será baseado nestas participações confirmadas.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  value={searchMembro}
                  onChange={(e) => setSearchMembro(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-400 text-xs">
                  {participacoesConfirmadas.size} de {membros.length} membros selecionados
                </p>
                {confirmacoesPresenca.size > 0 && (
                  <button
                    onClick={() => {
                      // Selecionar todos que confirmaram presença
                      setParticipacoesConfirmadas(new Set(Array.from(confirmacoesPresenca)));
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    Selecionar todos que confirmaram presença
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto border border-gray-700 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium w-12"></th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Nome de Guerra</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Nome Completo</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-medium w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {membros
                    .filter(membro => {
                      if (!searchMembro) return true;
                      const search = searchMembro.toLowerCase();
                      return membro.nome_guerra.toLowerCase().includes(search) ||
                             membro.nome_completo.toLowerCase().includes(search);
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          {searchMembro ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
                        </td>
                      </tr>
                    ) : (
                      membros
                        .filter(membro => {
                          if (!searchMembro) return true;
                          const search = searchMembro.toLowerCase();
                          return membro.nome_guerra.toLowerCase().includes(search) ||
                                 membro.nome_completo.toLowerCase().includes(search);
                        })
                        .map((membro) => {
                          const isParticipando = participacoesConfirmadas.has(membro.id);
                          const confirmouPresenca = confirmacoesPresenca.has(membro.id);

                          return (
                            <tr
                              key={membro.id}
                              className={`hover:bg-gray-800/30 transition ${isParticipando ? 'bg-blue-950/20' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isParticipando}
                                  onChange={() => handleToggleParticipacao(membro.id)}
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-white font-medium">{membro.nome_guerra}</td>
                              <td className="px-4 py-3 text-gray-300">{membro.nome_completo}</td>
                              <td className="px-4 py-3 text-center">
                                {confirmouPresenca && (
                                  <span className="inline-block px-2 py-1 bg-green-950/50 text-green-400 rounded text-xs">
                                    Confirmou
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarParticipacoes}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Participações
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
