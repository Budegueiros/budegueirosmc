import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Bike, 
  Users, 
  ArrowLeft, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  Upload, 
  Camera,
  Shield,
  ShieldOff,
  DollarSign,
  Bell,
  FileText,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { compressImage, isValidImageFile } from '../utils/imageCompression';
import { Membro, StatusMembroEnum, STATUS_STYLES } from '../types/database.types';

interface MotoData {
  id: string;
  modelo: string;
  marca: string;
  placa: string;
  ano: number;
  ativa: boolean;
}

interface ConjugeData {
  id: string;
  nome_completo: string;
  nome_guerra?: string | null;
  data_nascimento: string;
}

interface FilhoData {
  id: string;
  nome_completo: string;
  nome_guerra?: string | null;
  data_nascimento: string;
}

interface EditingMembro {
  nome_completo: string;
  nome_guerra: string;
  status_membro: StatusMembroEnum;
  numero_carteira: string;
  data_inicio: string;
  telefone: string;
  endereco_cidade: string;
  endereco_estado: string;
  foto_url: string | null;
  padrinho_id: string | null;
}

export default function ManageMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMembro, setEditingMembro] = useState(false);
  const [editingData, setEditingData] = useState<EditingMembro | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Motos
  const [motos, setMotos] = useState<MotoData[]>([]);
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [editingMoto, setEditingMoto] = useState<MotoData | null>(null);
  const [motoForm, setMotoForm] = useState({
    modelo: '',
    marca: '',
    placa: '',
    ano: new Date().getFullYear(),
    ativa: true
  });
  
  // Família
  const [conjuge, setConjuge] = useState<ConjugeData | null>(null);
  const [filhos, setFilhos] = useState<FilhoData[]>([]);
  const [showConjugeForm, setShowConjugeForm] = useState(false);
  const [showFilhoForm, setShowFilhoForm] = useState(false);
  const [editingFilho, setEditingFilho] = useState<FilhoData | null>(null);
  const [conjugeForm, setConjugeForm] = useState({
    nome_completo: '',
    nome_guerra: '',
    data_nascimento: ''
  });
  const [filhoForm, setFilhoForm] = useState({
    nome_completo: '',
    nome_guerra: '',
    data_nascimento: ''
  });
  
  // Cargos
  const [todosOsCargos, setTodosOsCargos] = useState<Array<{ id: string; nome: string; tipo_cargo: string; nivel: number }>>([]);
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
  const [cargosOriginais, setCargosOriginais] = useState<string[]>([]);
  const [padrinhosDisponiveis, setPadrinhosDisponiveis] = useState<Array<{ id: string; nome_guerra: string; nome_completo: string }>>([]);

  // Informações adicionais
  const [mensalidades, setMensalidades] = useState<Array<{
    id: string;
    mes_referencia: string;
    valor: number;
    status: string;
    data_vencimento: string;
    data_pagamento: string | null;
  }>>([]);
  const [comunicadosNaoLidos, setComunicadosNaoLidos] = useState<Array<{
    id: string;
    titulo: string;
    prioridade: string;
    created_at: string;
  }>>([]);
  const [enquetesNaoRespondidas, setEnquetesNaoRespondidas] = useState<Array<{
    id: string;
    titulo: string;
    data_encerramento: string;
    created_at: string;
  }>>([]);
  const [documentosNaoAcessados, setDocumentosNaoAcessados] = useState<Array<{
    id: string;
    titulo: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    if (isAdmin && id) {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading, id]);

  const carregarDados = async () => {
    if (!id) {
      console.error('ID do membro não fornecido');
      navigate('/manage-members');
      return;
    }
    
    setLoading(true);
    try {
      // Carregar membro
      const { data: membroData, error: membroError } = await supabase
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
        .eq('id', id)
        .single();

      if (membroError) {
        console.error('Erro ao buscar membro:', membroError);
        throw membroError;
      }
      
      if (!membroData) {
        console.error('Membro não encontrado com ID:', id);
        toastError('Membro não encontrado');
        navigate('/manage-members');
        return;
      }
      
      // Extrair apenas os campos do membro, removendo membro_cargos que é uma relação
      const membroLimpo: Membro = {
        id: membroData.id,
        user_id: membroData.user_id,
        nome_completo: membroData.nome_completo,
        nome_guerra: membroData.nome_guerra,
        padrinho_id: membroData.padrinho_id,
        status_membro: membroData.status_membro,
        numero_carteira: membroData.numero_carteira,
        data_inicio: membroData.data_inicio,
        telefone: membroData.telefone,
        email: membroData.email,
        endereco_cidade: membroData.endereco_cidade,
        endereco_estado: membroData.endereco_estado,
        foto_url: membroData.foto_url,
        ativo: membroData.ativo,
        is_admin: membroData.is_admin,
        created_at: membroData.created_at,
        updated_at: membroData.updated_at,
        padrinho: membroData.padrinho || null
      };
      
      setMembro(membroLimpo);
      setEditingData({
        nome_completo: membroData.nome_completo,
        nome_guerra: membroData.nome_guerra,
        status_membro: membroData.status_membro,
        numero_carteira: membroData.numero_carteira,
        data_inicio: membroData.data_inicio || '',
        telefone: membroData.telefone || '',
        endereco_cidade: membroData.endereco_cidade || '',
        endereco_estado: membroData.endereco_estado || '',
        foto_url: membroData.foto_url || null,
        padrinho_id: membroData.padrinho_id || null,
      });
      setPreviewUrl(membroData.foto_url || null);

      // Carregar cargos atuais
      const cargosAtuaisIds = (membroData.membro_cargos || [])
        .filter((mc: any) => mc && mc.cargos && mc.ativo)
        .map((mc: any) => mc.cargos.id) || [];
      setCargosSelecionados(cargosAtuaisIds);
      setCargosOriginais(cargosAtuaisIds);

      // Carregar motos
      try {
        const { data: motosData, error: motosError } = await supabase
          .from('motos')
          .select('*')
          .eq('membro_id', id)
          .order('created_at', { ascending: false });

        if (motosError) {
          console.error('Erro ao carregar motos:', motosError);
          toastError(`Erro ao carregar motos: ${motosError.message}`);
        } else {
          setMotos(motosData || []);
        }
      } catch (error: any) {
        console.error('Erro ao carregar motos:', error);
        setMotos([]);
      }

      // Carregar cônjuge
      try {
        const { data: conjugeData, error: conjugeError } = await supabase
          .from('conjuges')
          .select('*')
          .eq('membro_id', id)
          .maybeSingle();

        if (conjugeError) {
          console.error('Erro ao carregar cônjuge:', conjugeError);
          toastError(`Erro ao carregar cônjuge: ${conjugeError.message}`);
        } else {
          setConjuge(conjugeData);
        }
      } catch (error: any) {
        console.error('Erro ao carregar cônjuge:', error);
        setConjuge(null);
      }

      // Carregar filhos
      try {
        const { data: filhosData, error: filhosError } = await supabase
          .from('filhos')
          .select('*')
          .eq('membro_id', id)
          .order('data_nascimento', { ascending: true });

        if (filhosError) {
          console.error('Erro ao carregar filhos:', filhosError);
          toastError(`Erro ao carregar filhos: ${filhosError.message}`);
        } else {
          setFilhos(filhosData || []);
        }
      } catch (error: any) {
        console.error('Erro ao carregar filhos:', error);
        setFilhos([]);
      }

      // Carregar todos os cargos disponíveis
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('id, nome, tipo_cargo, nivel')
        .eq('ativo', true)
        .order('nivel', { ascending: true });

      if (cargosError) throw cargosError;
      setTodosOsCargos(cargosData || []);

      // Carregar padrinhos disponíveis
      const { data: padrinhosData, error: padrinhosError } = await supabase
        .from('membros')
        .select('id, nome_guerra, nome_completo')
        .eq('ativo', true)
        .order('nome_guerra', { ascending: true });

      if (padrinhosError) throw padrinhosError;
      setPadrinhosDisponiveis(padrinhosData || []);

      // Carregar mensalidades
      try {
        const { data: mensalidadesData, error: mensalidadesError } = await supabase
          .from('mensalidades')
          .select('*')
          .eq('membro_id', id)
          .order('mes_referencia', { ascending: false })
          .limit(12); // Últimas 12 mensalidades

        if (mensalidadesError) {
          console.error('Erro ao carregar mensalidades:', mensalidadesError);
        } else {
          setMensalidades(mensalidadesData || []);
        }
      } catch (error: any) {
        console.error('Erro ao carregar mensalidades:', error);
        setMensalidades([]);
      }

      // Carregar comunicados não lidos
      try {
        // Buscar todos os comunicados
        const { data: comunicadosData, error: comunicadosError } = await supabase
          .from('comunicados')
          .select('id, titulo, prioridade, created_at')
          .order('created_at', { ascending: false });

        if (comunicadosError) {
          console.error('Erro ao carregar comunicados:', comunicadosError);
        } else {
          // Buscar leituras do membro
          const { data: leiturasData } = await supabase
            .from('comunicados_leitura')
            .select('comunicado_id')
            .eq('membro_id', id);

          const idsLidos = new Set(leiturasData?.map((l) => l.comunicado_id) || []);
          const naoLidos = (comunicadosData || []).filter((c) => !idsLidos.has(c.id));
          setComunicadosNaoLidos(naoLidos);
        }
      } catch (error: any) {
        console.error('Erro ao carregar comunicados não lidos:', error);
        setComunicadosNaoLidos([]);
      }

      // Carregar enquetes não respondidas
      try {
        // Buscar enquetes abertas
        const { data: enquetesData, error: enquetesError } = await supabase
          .from('enquetes')
          .select('id, titulo, data_encerramento, created_at')
          .eq('status', 'aberta')
          .gte('data_encerramento', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (enquetesError) {
          console.error('Erro ao carregar enquetes:', enquetesError);
        } else {
          // Buscar votos do membro
          const { data: votosData } = await supabase
            .from('votos')
            .select('enquete_id')
            .eq('membro_id', id);

          const idsRespondidas = new Set(votosData?.map((v) => v.enquete_id) || []);
          const naoRespondidas = (enquetesData || []).filter((e) => !idsRespondidas.has(e.id));
          setEnquetesNaoRespondidas(naoRespondidas);
        }
      } catch (error: any) {
        console.error('Erro ao carregar enquetes não respondidas:', error);
        setEnquetesNaoRespondidas([]);
      }

      // Carregar documentos não acessados
      try {
        // Buscar todos os documentos
        const { data: documentosData, error: documentosError } = await supabase
          .from('documentos')
          .select('id, titulo, created_at')
          .order('created_at', { ascending: false });

        if (documentosError) {
          console.error('Erro ao carregar documentos:', documentosError);
        } else {
          // Buscar acessos do membro
          const { data: acessosData } = await supabase
            .from('documentos_acesso')
            .select('documento_id')
            .eq('membro_id', id);

          const idsAcessados = new Set(acessosData?.map((a) => a.documento_id) || []);
          const naoAcessados = (documentosData || []).filter((d) => !idsAcessados.has(d.id));
          setDocumentosNaoAcessados(naoAcessados);
        }
      } catch (error: any) {
        console.error('Erro ao carregar documentos não acessados:', error);
        setDocumentosNaoAcessados([]);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toastError(`Erro ao carregar dados do membro: ${error?.message || 'Erro desconhecido'}`);
      // Não navegar imediatamente, deixar o usuário ver o erro
      setTimeout(() => {
        navigate('/manage-members');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMembro = async () => {
    if (!editingData || !id) return;
    
    setSaving(true);
    try {
      let fotoUrl = editingData.foto_url;
      
      // Upload de foto se necessário
      if (previewUrl && previewUrl !== editingData.foto_url && previewUrl.startsWith('blob:')) {
        setUploading(true);
        const file = fileInputRef.current?.files?.[0];
        if (file && user) {
          const compressed = await compressImage(file, 2);
          const ext = file.name.split('.').pop();
          const filePath = `${user.id}/membros/${id}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressed, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          fotoUrl = publicUrlData?.publicUrl || null;
        }
        setUploading(false);
      }

      // Atualizar membro
      const { error } = await supabase
        .from('membros')
        .update({
          nome_completo: editingData.nome_completo,
          nome_guerra: editingData.nome_guerra.toUpperCase(),
          status_membro: editingData.status_membro,
          numero_carteira: editingData.numero_carteira,
          data_inicio: editingData.data_inicio || null,
          telefone: editingData.telefone || null,
          endereco_cidade: editingData.endereco_cidade || null,
          endereco_estado: editingData.endereco_estado || null,
          foto_url: fotoUrl,
          padrinho_id: editingData.padrinho_id || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Salvar cargos
      await handleSaveCargos();

      toastSuccess('Dados do membro atualizados com sucesso!');
      setEditingMembro(false);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toastError('Erro ao atualizar dados do membro');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleSaveCargos = async () => {
    if (!id) return;
    
    const cargosParaAdicionar = cargosSelecionados.filter(id => !cargosOriginais.includes(id));
    const cargosParaRemover = cargosOriginais.filter(id => !cargosSelecionados.includes(id));
    
    // Adicionar novos cargos
    for (const cargoId of cargosParaAdicionar) {
      const { error } = await supabase
        .from('membro_cargos')
        .insert({
          membro_id: id,
          cargo_id: cargoId,
          ativo: true
        });
      
      if (error) throw error;
    }
    
    // Remover cargos
    for (const cargoId of cargosParaRemover) {
      const { error } = await supabase
        .from('membro_cargos')
        .update({ ativo: false })
        .eq('membro_id', id)
        .eq('cargo_id', cargoId);
      
      if (error) throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      toastWarning('Selecione uma imagem válida (jpg, jpeg, png, webp)');
      return;
    }
    setUploading(true);
    const compressed = await compressImage(file, 2);
    setPreviewUrl(URL.createObjectURL(compressed));
    setUploading(false);
  };

  // Funções de Moto
  const handleSaveMoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      if (editingMoto) {
        const { error } = await supabase
          .from('motos')
          .update({
            modelo: motoForm.modelo,
            marca: motoForm.marca,
            placa: motoForm.placa.toUpperCase(),
            ano: motoForm.ano,
            ativa: motoForm.ativa
          })
          .eq('id', editingMoto.id);

        if (error) throw error;
        toastSuccess('Moto atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('motos')
          .insert({
            membro_id: id,
            modelo: motoForm.modelo,
            marca: motoForm.marca,
            placa: motoForm.placa.toUpperCase(),
            ano: motoForm.ano,
            ativa: motoForm.ativa
          });

        if (error) throw error;
        toastSuccess('Moto cadastrada com sucesso!');
      }

      setShowMotoForm(false);
      setEditingMoto(null);
      setMotoForm({ modelo: '', marca: '', placa: '', ano: new Date().getFullYear(), ativa: true });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar moto:', error);
      toastError('Erro ao salvar moto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMoto = async (motoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta moto?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('motos')
        .delete()
        .eq('id', motoId);

      if (error) throw error;
      toastSuccess('Moto excluída com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir moto:', error);
      toastError('Erro ao excluir moto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Funções de Família
  const handleSaveConjuge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      if (conjuge) {
        const { error } = await supabase
          .from('conjuges')
          .update({
            nome_completo: conjugeForm.nome_completo,
            nome_guerra: conjugeForm.nome_guerra || null,
            data_nascimento: conjugeForm.data_nascimento
          })
          .eq('id', conjuge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conjuges')
          .insert({
            membro_id: id,
            nome_completo: conjugeForm.nome_completo,
            nome_guerra: conjugeForm.nome_guerra || null,
            data_nascimento: conjugeForm.data_nascimento
          });

        if (error) throw error;
      }

      setShowConjugeForm(false);
      setConjugeForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar cônjuge:', error);
      toastError('Erro ao salvar cônjuge. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFilho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      if (editingFilho) {
        const { error } = await supabase
          .from('filhos')
          .update({
            nome_completo: filhoForm.nome_completo,
            nome_guerra: filhoForm.nome_guerra || null,
            data_nascimento: filhoForm.data_nascimento
          })
          .eq('id', editingFilho.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('filhos')
          .insert({
            membro_id: id,
            nome_completo: filhoForm.nome_completo,
            nome_guerra: filhoForm.nome_guerra || null,
            data_nascimento: filhoForm.data_nascimento
          });

        if (error) throw error;
      }

      setShowFilhoForm(false);
      setEditingFilho(null);
      setFilhoForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar filho:', error);
      toastError('Erro ao salvar filho. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConjuge = async () => {
    if (!conjuge || !confirm('Tem certeza que deseja remover o cônjuge?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('conjuges')
        .delete()
        .eq('id', conjuge.id);

      if (error) throw error;
      toastSuccess('Cônjuge removido com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir cônjuge:', error);
      toastError('Erro ao excluir cônjuge. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFilho = async (filhoId: string) => {
    if (!confirm('Tem certeza que deseja remover este filho?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('filhos')
        .delete()
        .eq('id', filhoId);

      if (error) throw error;
      toastSuccess('Filho removido com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir filho:', error);
      toastError('Erro ao excluir filho. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async () => {
    if (!membro) return;

    try {
      const { error } = await supabase
        .from('membros')
        .update({ ativo: !membro.ativo })
        .eq('id', membro.id);

      if (error) throw error;
      toastSuccess(`Membro ${!membro.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastError('Erro ao alterar status do membro');
    }
  };

  const handleToggleAdmin = async () => {
    if (!membro) return;
    if (membro.user_id === user?.id && membro.is_admin) {
      toastWarning('Você não pode remover seus próprios privilégios de administrador');
      return;
    }

    try {
      const { error } = await supabase
        .from('membros')
        .update({ is_admin: !membro.is_admin })
        .eq('id', membro.id);

      if (error) throw error;
      toastSuccess(`Privilégios de administrador ${!membro.is_admin ? 'concedidos' : 'removidos'} com sucesso!`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar admin:', error);
      toastError('Erro ao alterar privilégios de administrador');
    }
  };

  const formatarMes = (mesReferencia: string) => {
    const date = new Date(mesReferencia + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

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

  if (!membro) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider mb-4">
            Membro não encontrado
          </p>
          <Link
            to="/manage-members"
            className="inline-flex items-center gap-2 text-brand-red hover:text-red-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciar Integrantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/manage-members"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciar Integrantes
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-8 h-8 text-brand-red flex-shrink-0" />
                <div>
                  <h1 className="text-brand-red font-oswald text-2xl sm:text-3xl md:text-4xl uppercase font-bold break-words">
                    {membro.nome_guerra}
                  </h1>
                  <p className="text-gray-400 text-sm">{membro.nome_completo}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {membro.is_admin && (
                  <span className="inline-flex items-center gap-1 bg-brand-red/20 border border-brand-red/50 text-brand-red px-2 py-0.5 rounded text-xs font-oswald uppercase">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
                {!membro.ativo && (
                  <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-oswald uppercase">
                    Inativo
                  </span>
                )}
                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLES[membro.status_membro].bg} ${STATUS_STYLES[membro.status_membro].text}`}>
                  {membro.status_membro}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {!editingMembro ? (
                <>
                  <button
                    onClick={() => setEditingMembro(true)}
                    className="flex items-center justify-center gap-2 bg-brand-red/20 hover:bg-brand-red/30 text-brand-red px-4 py-2 rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={handleToggleAdmin}
                    className={`${
                      membro.is_admin
                        ? 'bg-brand-red/20 hover:bg-brand-red/30 text-brand-red'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } p-2 rounded transition flex items-center justify-center`}
                    title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                  >
                    {membro.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleToggleAtivo}
                    className={`${
                      membro.ativo
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                    } px-3 py-2 rounded transition text-sm font-oswald uppercase`}
                  >
                    {membro.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveMembro}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingMembro(false);
                      setPreviewUrl(membro.foto_url || null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      carregarDados();
                    }}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Edição do Membro */}
        {editingMembro && editingData && (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 mb-6">
            <h2 className="text-white font-oswald text-lg uppercase font-bold mb-4">Editar Informações do Membro</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload de Foto */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Foto do Membro (opcional)</label>
                <div className="flex items-center gap-4">
                  <div>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-brand-red/30" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700 text-gray-500">
                        <Camera className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={saving || uploading}
                      className="hidden"
                      id="foto-upload"
                    />
                    <label htmlFor="foto-upload" className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-3 py-2 rounded cursor-pointer text-xs font-bold transition disabled:opacity-50">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Selecionar Foto'}
                    </label>
                    {previewUrl && (
                      <button
                        type="button"
                        className="ml-2 text-xs text-gray-400 hover:text-red-500 underline"
                        onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        disabled={saving || uploading}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={editingData.nome_completo}
                  onChange={(e) => setEditingData({ ...editingData, nome_completo: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome de Guerra</label>
                <input
                  type="text"
                  value={editingData.nome_guerra}
                  onChange={(e) => setEditingData({ ...editingData, nome_guerra: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red uppercase"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={editingData.status_membro}
                  onChange={(e) => setEditingData({ ...editingData, status_membro: e.target.value as StatusMembroEnum })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                >
                  <option value="Aspirante">Aspirante</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Brasionado">Brasionado</option>
                  <option value="Nomade">Nômade</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Número da Carteira</label>
                <input
                  type="text"
                  value={editingData.numero_carteira}
                  onChange={(e) => setEditingData({ ...editingData, numero_carteira: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data de Início</label>
                <input
                  type="date"
                  value={editingData.data_inicio}
                  onChange={(e) => setEditingData({ ...editingData, data_inicio: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Telefone</label>
                <input
                  type="tel"
                  value={editingData.telefone}
                  onChange={(e) => setEditingData({ ...editingData, telefone: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Cidade</label>
                <input
                  type="text"
                  value={editingData.endereco_cidade}
                  onChange={(e) => setEditingData({ ...editingData, endereco_cidade: e.target.value })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Estado</label>
                <select
                  value={editingData.endereco_estado}
                  onChange={(e) => setEditingData({ ...editingData, endereco_estado: e.target.value })}
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
                <label className="block text-gray-400 text-xs uppercase mb-1">Padrinho</label>
                <select
                  value={editingData.padrinho_id || ''}
                  onChange={(e) => setEditingData({ ...editingData, padrinho_id: e.target.value || null })}
                  className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                  disabled={saving}
                >
                  <option value="">Nenhum</option>
                  {padrinhosDisponiveis
                    .filter(p => p.id !== id)
                    .map((padrinho) => (
                      <option key={padrinho.id} value={padrinho.id}>
                        {padrinho.nome_guerra} - {padrinho.nome_completo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Informação do Email (não editável) */}
            <div className="pt-3 border-t border-gray-700 mt-4">
              <p className="text-gray-500 text-xs">
                📧 Email: <span className="text-gray-400">{membro.email}</span> (não editável)
              </p>
            </div>

            {/* Seção de Cargos */}
            <div className="pt-4 border-t border-gray-700 mt-4">
              <h4 className="text-white font-oswald text-sm uppercase font-bold mb-3">Cargos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {todosOsCargos.map((cargo) => {
                  const isSelected = cargosSelecionados.includes(cargo.id);
                  return (
                    <button
                      key={cargo.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setCargosSelecionados(cargosSelecionados.filter(id => id !== cargo.id));
                        } else {
                          setCargosSelecionados([...cargosSelecionados, cargo.id]);
                        }
                      }}
                      disabled={saving}
                      className={`px-3 py-2 rounded text-xs transition ${
                        isSelected
                          ? 'bg-brand-red text-white border border-brand-red'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-brand-red/50'
                      } disabled:opacity-50`}
                    >
                      <div className="font-semibold">{cargo.nome}</div>
                      <div className="text-xs opacity-75">{cargo.tipo_cargo}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grid de Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motos */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-oswald text-lg uppercase font-bold flex items-center gap-2">
                <Bike className="w-5 h-5 text-brand-red" />
                Motos ({motos.length})
              </h2>
              {!showMotoForm && (
                <button
                  onClick={() => setShowMotoForm(true)}
                  className="bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-xs py-1.5 px-3 rounded transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </button>
              )}
            </div>

            <div className="p-6">
              {motos.length === 0 && !showMotoForm && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhuma moto cadastrada</p>
                </div>
              )}

              {motos.length > 0 && !showMotoForm && (
                <div className="space-y-3">
                  {motos.map((moto) => (
                    <div key={moto.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-oswald text-sm uppercase font-bold mb-1">
                            {moto.marca} {moto.modelo}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            Placa: <span className="font-mono">{moto.placa}</span> • Ano: {moto.ano}
                          </p>
                          {!moto.ativa && (
                            <span className="inline-block mt-2 text-xs text-gray-500">Inativa</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingMoto(moto);
                              setMotoForm({
                                modelo: moto.modelo,
                                marca: moto.marca,
                                placa: moto.placa,
                                ano: moto.ano,
                                ativa: moto.ativa
                              });
                              setShowMotoForm(true);
                            }}
                            className="text-gray-400 hover:text-brand-red transition p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMoto(moto.id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showMotoForm && (
                <form onSubmit={handleSaveMoto} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={motoForm.marca}
                      onChange={(e) => setMotoForm({ ...motoForm, marca: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      value={motoForm.modelo}
                      onChange={(e) => setMotoForm({ ...motoForm, modelo: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Placa *
                    </label>
                    <input
                      type="text"
                      value={motoForm.placa}
                      onChange={(e) => setMotoForm({ ...motoForm, placa: e.target.value.toUpperCase() })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-brand-red transition"
                      required
                      maxLength={7}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-oswald uppercase mb-2">
                      Ano *
                    </label>
                    <input
                      type="number"
                      value={motoForm.ano}
                      onChange={(e) => setMotoForm({ ...motoForm, ano: parseInt(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition"
                      required
                      min={1900}
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ativa"
                      checked={motoForm.ativa}
                      onChange={(e) => setMotoForm({ ...motoForm, ativa: e.target.checked })}
                      className="w-5 h-5 text-brand-red bg-gray-800 border-gray-700 rounded focus:ring-brand-red focus:ring-2"
                    />
                    <label htmlFor="ativa" className="text-gray-400 text-sm">
                      Moto ativa
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : editingMoto ? 'Atualizar' : 'Adicionar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMotoForm(false);
                        setEditingMoto(null);
                        setMotoForm({ modelo: '', marca: '', placa: '', ano: new Date().getFullYear(), ativa: true });
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Família */}
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-6 py-4">
              <h2 className="text-white font-oswald text-lg uppercase font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-red" />
                Núcleo Familiar
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Cônjuge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-red" />
                    Cônjuge
                  </h3>
                  {!conjuge && !showConjugeForm && (
                    <button
                      onClick={() => setShowConjugeForm(true)}
                      className="bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-xs py-1 px-3 rounded transition"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Adicionar
                    </button>
                  )}
                </div>

                {conjuge && !showConjugeForm && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1">{conjuge.nome_completo}</p>
                        {conjuge.nome_guerra && (
                          <p className="text-gray-300 text-xs mb-1">Nome de Guerra: {conjuge.nome_guerra}</p>
                        )}
                        <p className="text-gray-400 text-xs">
                          {new Date(conjuge.data_nascimento).toLocaleDateString('pt-BR')} • {calcularIdade(conjuge.data_nascimento)} anos
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setConjugeForm({
                              nome_completo: conjuge.nome_completo,
                              nome_guerra: conjuge.nome_guerra || '',
                              data_nascimento: conjuge.data_nascimento
                            });
                            setShowConjugeForm(true);
                          }}
                          className="text-gray-400 hover:text-brand-red transition p-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleDeleteConjuge}
                          className="text-gray-400 hover:text-red-500 transition p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showConjugeForm && (
                  <form onSubmit={handleSaveConjuge} className="space-y-3 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={conjugeForm.nome_completo}
                        onChange={(e) => setConjugeForm({ ...conjugeForm, nome_completo: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Nome de Guerra
                      </label>
                      <input
                        type="text"
                        value={conjugeForm.nome_guerra}
                        onChange={(e) => setConjugeForm({ ...conjugeForm, nome_guerra: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={conjugeForm.data_nascimento}
                        onChange={(e) => setConjugeForm({ ...conjugeForm, data_nascimento: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-xs py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowConjugeForm(false);
                          setConjugeForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
                        }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold text-xs py-2 px-4 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Filhos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-red" />
                    Filhos ({filhos.length})
                  </h3>
                  {!showFilhoForm && (
                    <button
                      onClick={() => setShowFilhoForm(true)}
                      className="bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-xs py-1 px-3 rounded transition"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Adicionar
                    </button>
                  )}
                </div>

                {filhos.length > 0 && !showFilhoForm && (
                  <div className="space-y-2">
                    {filhos.map((filho) => (
                      <div key={filho.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm mb-1">{filho.nome_completo}</p>
                            {filho.nome_guerra && (
                              <p className="text-gray-300 text-xs mb-1">Nome de Guerra: {filho.nome_guerra}</p>
                            )}
                            <p className="text-gray-400 text-xs">
                              {new Date(filho.data_nascimento).toLocaleDateString('pt-BR')} • {calcularIdade(filho.data_nascimento)} anos
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingFilho(filho);
                                setFilhoForm({
                                  nome_completo: filho.nome_completo,
                                  nome_guerra: filho.nome_guerra || '',
                                  data_nascimento: filho.data_nascimento
                                });
                                setShowFilhoForm(true);
                              }}
                              className="text-gray-400 hover:text-brand-red transition p-1"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteFilho(filho.id)}
                              className="text-gray-400 hover:text-red-500 transition p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showFilhoForm && (
                  <form onSubmit={handleSaveFilho} className="space-y-3 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={filhoForm.nome_completo}
                        onChange={(e) => setFilhoForm({ ...filhoForm, nome_completo: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Nome de Guerra
                      </label>
                      <input
                        type="text"
                        value={filhoForm.nome_guerra}
                        onChange={(e) => setFilhoForm({ ...filhoForm, nome_guerra: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-oswald uppercase mb-1">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={filhoForm.data_nascimento}
                        onChange={(e) => setFilhoForm({ ...filhoForm, data_nascimento: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red transition"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-xs py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : editingFilho ? 'Atualizar' : 'Adicionar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFilhoForm(false);
                          setEditingFilho(null);
                          setFilhoForm({ nome_completo: '', nome_guerra: '', data_nascimento: '' });
                        }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-oswald uppercase font-bold text-xs py-2 px-4 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Seção de Informações Adicionais */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mensalidades */}
            <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-red" />
                  Mensalidades ({mensalidades.length})
                </h3>
                <Link
                  to="/manage-payments"
                  className="text-brand-red hover:text-red-400 text-xs font-oswald uppercase transition"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mensalidades.length === 0 ? (
                  <p className="text-gray-500 text-xs">Nenhuma mensalidade encontrada</p>
                ) : (
                  mensalidades.slice(0, 5).map((mensalidade) => {
                    const statusColor = 
                      mensalidade.status === 'Pago' ? 'text-green-400' :
                      mensalidade.status === 'Atrasado' ? 'text-red-400' :
                      mensalidade.status === 'Pendente' ? 'text-yellow-400' :
                      'text-gray-400';
                    
                    return (
                      <div key={mensalidade.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-xs mb-1">
                              {formatarMes(mensalidade.mes_referencia)}
                            </p>
                            <p className="text-gray-400 text-xs">
                              R$ {mensalidade.valor.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Vencimento: {formatarData(mensalidade.data_vencimento)}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold ${statusColor}`}>
                            {mensalidade.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Comunicados Não Lidos */}
            <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-red" />
                  Comunicados Não Lidos ({comunicadosNaoLidos.length})
                </h3>
                <Link
                  to="/comunicados"
                  className="text-brand-red hover:text-red-400 text-xs font-oswald uppercase transition"
                >
                  Ver todos
                </Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comunicadosNaoLidos.length === 0 ? (
                  <p className="text-gray-500 text-xs">Nenhum comunicado não lido</p>
                ) : (
                  comunicadosNaoLidos.slice(0, 5).map((comunicado) => {
                    const prioridadeColor = 
                      comunicado.prioridade === 'critica' ? 'text-red-400' :
                      comunicado.prioridade === 'alta' ? 'text-yellow-400' :
                      'text-gray-400';
                    
                    return (
                      <div key={comunicado.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-xs mb-1 line-clamp-2">
                              {comunicado.titulo}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(comunicado.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold ${prioridadeColor} ml-2`}>
                            {comunicado.prioridade === 'critica' ? 'Crítica' :
                             comunicado.prioridade === 'alta' ? 'Alta' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Enquetes Não Respondidas */}
            <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-brand-red" />
                  Enquetes Não Respondidas ({enquetesNaoRespondidas.length})
                </h3>
                <Link
                  to="/polls"
                  className="text-brand-red hover:text-red-400 text-xs font-oswald uppercase transition"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {enquetesNaoRespondidas.length === 0 ? (
                  <p className="text-gray-500 text-xs">Nenhuma enquete não respondida</p>
                ) : (
                  enquetesNaoRespondidas.slice(0, 5).map((enquete) => {
                    const encerramento = new Date(enquete.data_encerramento);
                    const hoje = new Date();
                    const diasRestantes = Math.ceil((encerramento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={enquete.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-xs mb-1 line-clamp-2">
                              {enquete.titulo}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Encerra em: {encerramento.toLocaleDateString('pt-BR')}
                            </p>
                            {diasRestantes > 0 && (
                              <p className="text-yellow-400 text-xs mt-1">
                                {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Documentos Não Acessados */}
            <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-oswald text-sm uppercase font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-red" />
                  Documentos Não Acessados ({documentosNaoAcessados.length})
                </h3>
                <Link
                  to="/documentos"
                  className="text-brand-red hover:text-red-400 text-xs font-oswald uppercase transition"
                >
                  Ver todos
                </Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {documentosNaoAcessados.length === 0 ? (
                  <p className="text-gray-500 text-xs">Nenhum documento não acessado</p>
                ) : (
                  documentosNaoAcessados.slice(0, 5).map((documento) => (
                    <div key={documento.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-xs mb-1 line-clamp-2">
                            {documento.titulo}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(documento.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

