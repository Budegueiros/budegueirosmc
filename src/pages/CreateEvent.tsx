import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Save, Loader2, MapPin, Users, Camera, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { compressImage, isValidImageFile } from '../utils/imageCompression';

export default function CreateEvent() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_evento: '',
    hora_saida: '',
    local_saida: '',
    local_destino: '',
    cidade: '',
    estado: '',
    distancia_km: '',
    tipo_evento: 'Role',
    status: 'Ativo',
    vagas_limitadas: false,
    max_participantes: '',
    observacoes: '',
    evento_principal: false,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      toastWarning('Por favor, selecione uma imagem válida (JPG, PNG ou WEBP)');
      return;
    }

    try {
      // Comprimir imagem automaticamente
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

  const handleGaleriaFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
            setGaleriaPreviews([...galeriaPreviews, ...previews]);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
      }
    }

    setGaleriaFiles([...galeriaFiles, ...validFiles]);
  };

  const removeGaleriaFile = (index: number) => {
    setGaleriaFiles(galeriaFiles.filter((_, i) => i !== index));
    setGaleriaPreviews(galeriaPreviews.filter((_, i) => i !== index));
  };

  const uploadFotoCapa = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    try {
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

  const uploadFotosGaleria = async (eventoId: string) => {
    if (galeriaFiles.length === 0) return;

    try {
      for (let i = 0; i < galeriaFiles.length; i++) {
        const file = galeriaFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${eventoId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `eventos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('evento_fotos')
          .insert({
            evento_id: eventoId,
            foto_url: urlData.publicUrl,
            ordem: i,
            ativo: true
          });

        if (dbError) throw dbError;
      }
    } catch (error) {
      console.error('Erro ao fazer upload das fotos da galeria:', error);
      toastError('Erro ao fazer upload de algumas fotos da galeria');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let foto_capa_url = null;
      if (selectedFile) {
        foto_capa_url = await uploadFotoCapa();
      }

      const { data: eventoData, error } = await supabase
        .from('eventos')
        .insert({
          nome: formData.nome,
          descricao: formData.descricao || null,
          data_evento: formData.data_evento,
          hora_saida: formData.hora_saida || null,
          local_saida: formData.local_saida,
          local_destino: formData.local_destino || null,
          cidade: formData.cidade,
          estado: formData.estado,
          distancia_km: formData.distancia_km ? parseInt(formData.distancia_km) : null,
          tipo_evento: formData.tipo_evento,
          status: formData.status,
          vagas_limitadas: formData.vagas_limitadas,
          max_participantes: formData.vagas_limitadas && formData.max_participantes 
            ? parseInt(formData.max_participantes) 
            : null,
          foto_capa_url,
          observacoes: formData.observacoes || null,
          evento_principal: formData.evento_principal,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload fotos da galeria se houver
      if (eventoData && galeriaFiles.length > 0) {
        await uploadFotosGaleria(eventoData.id);
      }

      toastSuccess('Evento criado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toastError('Erro ao criar evento');
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading) {
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
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Painel Administrativo
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-brand-red" />
            <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
              Criar Evento / Role
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Cadastre um novo evento ou rolê para o moto clube
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Foto de Capa */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto de Capa
            </h2>
            
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Remover
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-brand-red/30 rounded-lg cursor-pointer hover:border-brand-red/50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-400 font-oswald uppercase mb-1">
                    Clique para escolher uma foto
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Informações Básicas */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Nome do Evento / Role *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  placeholder="Ex: Role Serra da Mantiqueira"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  rows={3}
                  placeholder="Descreva o evento, pontos de parada, etc..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Tipo de Evento *
                </label>
                <select
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
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
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  value={formData.data_evento}
                  onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Hora de Saída
                </label>
                <input
                  type="time"
                  value={formData.hora_saida}
                  onChange={(e) => setFormData({ ...formData, hora_saida: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Local de Saída *
                </label>
                <input
                  type="text"
                  value={formData.local_saida}
                  onChange={(e) => setFormData({ ...formData, local_saida: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  placeholder="Ex: Posto Shell - Rodovia Presidente Dutra"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Local de Destino
                </label>
                <input
                  type="text"
                  value={formData.local_destino}
                  onChange={(e) => setFormData({ ...formData, local_destino: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  placeholder="Ex: Campos do Jordão - SP"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="BA">Bahia</option>
                  <option value="GO">Goiás</option>
                  <option value="MT">Mato Grosso</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Distância (KM)
                </label>
                <input
                  type="number"
                  value={formData.distancia_km}
                  onChange={(e) => setFormData({ ...formData, distancia_km: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  placeholder="Ex: 150"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Vagas e Participantes */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Vagas e Participantes
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vagas_limitadas"
                  checked={formData.vagas_limitadas}
                  onChange={(e) => setFormData({ ...formData, vagas_limitadas: e.target.checked })}
                  className="w-4 h-4 text-brand-red bg-black border-brand-red/30 rounded focus:ring-brand-red"
                />
                <label htmlFor="vagas_limitadas" className="text-gray-300 text-sm">
                  Limitar número de participantes
                </label>
              </div>

              {formData.vagas_limitadas && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">
                    Máximo de Participantes
                  </label>
                  <input
                    type="number"
                    value={formData.max_participantes}
                    onChange={(e) => setFormData({ ...formData, max_participantes: e.target.value })}
                    className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                    placeholder="Ex: 20"
                    min="1"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="evento_principal"
                  checked={formData.evento_principal}
                  onChange={(e) => setFormData({ ...formData, evento_principal: e.target.checked })}
                  className="w-4 h-4 text-brand-red bg-black border-brand-red/30 rounded focus:ring-brand-red"
                />
                <label htmlFor="evento_principal" className="text-gray-300 text-sm">
                  Evento Principal (Exibir na página pública)
                </label>
              </div>
            </div>
          </div>

          {/* Galeria de Fotos - Apenas para Eventos Principais */}
          {formData.evento_principal && (
            <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
              <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Galeria de Fotos do Evento
              </h2>
              
              <p className="text-gray-400 text-sm mb-4">
                Adicione múltiplas fotos que aparecerão na galeria do evento na página pública.
              </p>

              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-red/30 rounded-lg cursor-pointer hover:border-brand-red/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400 font-oswald uppercase">
                      Clique para adicionar fotos
                    </p>
                    <p className="text-xs text-gray-500">
                      Múltiplas seleções permitidas
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleGaleriaFilesChange}
                  />
                </label>
              </div>

              {galeriaPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galeriaPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeGaleriaFile(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Observações
            </h2>
            
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
              rows={4}
              placeholder="Informações adicionais, recomendações, equipamentos necessários, etc..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? 'Enviando imagem...' : 'Criando evento...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Criar Evento
                </>
              )}
            </button>

            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
