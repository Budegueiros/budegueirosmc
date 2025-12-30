import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Upload, Loader2, Save, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression';

interface Membro {
  id: string;
  user_id: string;
  nome_completo: string;
  nome_guerra: string;
  telefone: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  foto_url: string | null;
}

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [membro, setMembro] = useState<Membro | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_guerra: '',
    telefone: '',
    endereco_cidade: '',
    endereco_estado: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    carregarPerfil();
  }, [user, navigate]);

  const carregarPerfil = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setMembro(data);
      setFormData({
        nome_completo: data.nome_completo || '',
        nome_guerra: data.nome_guerra || '',
        telefone: data.telefone || '',
        endereco_cidade: data.endereco_cidade || '',
        endereco_estado: data.endereco_estado || '',
      });
      setPreviewUrl(data.foto_url);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      alert('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!isValidImageFile(file)) {
      alert('Por favor, selecione uma imagem válida (JPG, PNG ou WEBP)');
      return;
    }

    setUploading(true);
    try {
      // Comprimir imagem automaticamente se necessário
      console.log(`Tamanho original: ${formatFileSize(file.size)}`);
      const compressedFile = await compressImage(file, 5);
      console.log(`Tamanho após compressão: ${formatFileSize(compressedFile.size)}`);

      // Deletar imagem antiga se existir
      if (membro?.foto_url) {
        const oldPath = membro.foto_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload da nova imagem
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from('membros')
        .update({ foto_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      setMembro(prev => prev ? { ...prev, foto_url: publicUrl } : null);

      // Mostrar mensagem de sucesso se a imagem foi comprimida
      if (file.size > compressedFile.size) {
        alert(`Foto enviada com sucesso!\nTamanho reduzido de ${formatFileSize(file.size)} para ${formatFileSize(compressedFile.size)}`);
      }
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('membros')
        .update({
          nome_completo: formData.nome_completo,
          nome_guerra: formData.nome_guerra.toUpperCase(),
          telefone: formData.telefone || null,
          endereco_cidade: formData.endereco_cidade || null,
          endereco_estado: formData.endereco_estado || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-brand-red" />
            <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
              Editar Perfil
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Atualize suas informações e foto de perfil
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Upload de Foto */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Foto de Perfil
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Preview da Foto */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 border-4 border-brand-red/30">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-red/30 rounded-lg cursor-pointer hover:border-brand-red/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400 font-oswald uppercase">
                      {uploading ? 'Enviando...' : 'Clique para escolher uma foto'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG ou WEBP (máx. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Informações Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Nome de Guerra *
                </label>
                <input
                  type="text"
                  value={formData.nome_guerra}
                  onChange={(e) => setFormData({ ...formData, nome_guerra: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Estado
                </label>
                <select
                  value={formData.endereco_estado}
                  onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informações Somente Leitura */}
          <div className="bg-brand-gray border border-gray-700 rounded-xl p-6">
            <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
              Informações do Clube
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{membro?.user_id ? user?.email : '-'}</span>
              </div>
              
              <p className="text-gray-500 text-xs mt-4">
                Para alterar status, cargos, número da carteira ou outros dados administrativos, entre em contato com um administrador.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>

            <Link
              to="/dashboard"
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
