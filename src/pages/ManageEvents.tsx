import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Search, Edit2, Trash2, ArrowLeft, X, Loader2, Save, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { compressImage, isValidImageFile } from '../utils/imageCompression';

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
  const navigate = useNavigate();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingEvento | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvento = (evento: Evento) => {
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
      alert('Por favor, selecione uma imagem válida (JPG, PNG ou WEBP)');
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
      alert('Erro ao processar imagem. Tente novamente.');
    }
  };

  const uploadFotoCapa = async (eventoId: string): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    try {
      // Buscar evento para deletar foto antiga se existir
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
      alert('Erro ao fazer upload da foto de capa');
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
        alert(`Arquivo ${file.name} não é uma imagem válida`);
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

        // Inserir na tabela evento_fotos
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
      alert('Erro ao fazer upload de algumas fotos da galeria');
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

      // Upload de fotos da galeria (se houver)
      if (galeriaFiles.length > 0 && editingData.evento_principal) {
        await uploadFotosGaleria(eventoId);
      }

      // Recarregar eventos
      await carregarEventos();
      setEditingId(null);
      setEditingData(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
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

  const handleDeleteEvento = async (eventoId: string, eventoNome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o evento "${eventoNome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoId);

      if (error) throw error;

      setEventos(eventos.filter(e => e.id !== eventoId));
      alert('Evento deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento');
    }
  };

  const eventosFiltrados = eventos.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
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
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-brand-red" />
                <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
                  Gerenciar Eventos
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Gerencie todos os eventos e roles do clube
              </p>
            </div>

            <Link
              to="/create-event"
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              Criar Evento
            </Link>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar evento por nome, cidade ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {eventosFiltrados.map((evento) => (
            <div
              key={evento.id}
              className={`bg-brand-gray border ${
                evento.status === 'Ativo' ? 'border-brand-red/30' : 'border-gray-700'
              } rounded-xl p-5 ${evento.status === 'Cancelado' ? 'opacity-60' : ''}`}
            >
              {editingId === evento.id && editingData ? (
                /* Modo de Edição */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-oswald text-lg uppercase font-bold">Editando Evento</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEvento(evento.id)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-xs uppercase mb-1">Nome do Evento</label>
                      <input
                        type="text"
                        value={editingData.nome}
                        onChange={(e) => setEditingData({ ...editingData, nome: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                          <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-brand-red transition text-center">
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
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Hora de Saída</label>
                      <input
                        type="time"
                        value={editingData.hora_saida}
                        onChange={(e) => setEditingData({ ...editingData, hora_saida: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-xs uppercase mb-1">Local de Saída</label>
                      <input
                        type="text"
                        value={editingData.local_saida}
                        onChange={(e) => setEditingData({ ...editingData, local_saida: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-xs uppercase mb-1">Local de Destino</label>
                      <input
                        type="text"
                        value={editingData.local_destino}
                        onChange={(e) => setEditingData({ ...editingData, local_destino: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Cidade</label>
                      <input
                        type="text"
                        value={editingData.cidade}
                        onChange={(e) => setEditingData({ ...editingData, cidade: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Estado</label>
                      <select
                        value={editingData.estado}
                        onChange={(e) => setEditingData({ ...editingData, estado: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-gray-400 text-xs uppercase mb-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingData.vagas_limitadas}
                          onChange={(e) => setEditingData({ ...editingData, vagas_limitadas: e.target.checked })}
                          className="w-4 h-4 text-brand-red bg-black border-brand-red/30 rounded focus:ring-brand-red"
                          disabled={saving}
                        />
                        Limitar Vagas
                      </label>
                      {editingData.vagas_limitadas && (
                        <input
                          type="number"
                          value={editingData.max_participantes}
                          onChange={(e) => setEditingData({ ...editingData, max_participantes: e.target.value })}
                          className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red mt-2"
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
                          className="w-4 h-4 text-brand-red bg-black border-brand-red/30 rounded focus:ring-brand-red"
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
                          id={`galeria-upload-${evento.id}`}
                          disabled={saving}
                        />
                        <label
                          htmlFor={`galeria-upload-${evento.id}`}
                          className="cursor-pointer bg-brand-red/10 border border-brand-red/30 hover:bg-brand-red/20 text-white px-4 py-2 rounded text-sm flex items-center gap-2 justify-center transition"
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
                                  className="w-full h-24 object-cover rounded border border-brand-red/30"
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
                </div>
              ) : (
                /* Modo de Visualização */
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-oswald text-xl uppercase font-bold">
                        {evento.nome}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-oswald uppercase ${
                        evento.status === 'Ativo' 
                          ? 'bg-green-600/20 border border-green-600/50 text-green-500'
                          : evento.status === 'Cancelado'
                          ? 'bg-red-600/20 border border-red-600/50 text-red-500'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {evento.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">{evento.tipo_evento}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>📅 {new Date(evento.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      {evento.hora_saida && <span>🕐 {evento.hora_saida}</span>}
                      <span>📍 {evento.cidade} - {evento.estado}</span>
                      {evento.distancia_km && <span>🏍️ {evento.distancia_km} km</span>}
                      {evento.vagas_limitadas && evento.max_participantes && (
                        <span>👥 Máx: {evento.max_participantes}</span>
                      )}
                    </div>

                    {evento.descricao && (
                      <p className="text-gray-400 text-sm mt-2">{evento.descricao}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvento(evento)}
                      className="bg-brand-red/20 hover:bg-brand-red/30 text-brand-red p-2 rounded transition"
                      title="Editar evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteEvento(evento.id, evento.nome)}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-500 p-2 rounded transition"
                      title="Deletar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {eventosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
