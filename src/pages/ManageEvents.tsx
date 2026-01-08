import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Plus, Loader2, Download, FileDown, X, Save, Upload } from 'lucide-react';
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

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarEventos();
    }
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
      ? eventosFuturos[0].nome 
      : null;

    return {
      totalEventos: eventos.length,
      eventosAtivos: eventosAtivos.length,
      eventosFinalizados: eventosFinalizados.length,
      proximoEvento
    };
  }, [eventos]);

  const handleEditEvento = (eventoId: string) => {
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) return;

    setEditingId(evento.id);
    setEditingData({
      nome: evento.nome,
      descricao: evento.descricao || '',
      data_evento: evento.data_evento,
      hora_saida: evento.hora_saida || '',
      local_saida: evento.local_saida,
      local_destino: evento.local_destino || '',
      cidade: evento.cidade,
      estado: evento.estado,
      distancia_km: evento.distancia_km?.toString() || '',
      tipo_evento: evento.tipo_evento,
      status: evento.status,
      vagas_limitadas: evento.vagas_limitadas,
      max_participantes: evento.max_participantes?.toString() || '',
      observacoes: evento.observacoes || '',
      evento_principal: evento.evento_principal,
    });
    setSelectedFile(null);
    setPreviewUrl(evento.foto_capa_url);
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

      {/* Modal de Edição */}
      {editingId && editingData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">Editar Evento</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}
