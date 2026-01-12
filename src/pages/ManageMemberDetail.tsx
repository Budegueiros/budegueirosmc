import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Bike, 
  Users, 
  ArrowLeft, 
  Edit2, 
  Plus, 
  Trash2, 
  Loader2, 
  Shield,
  ShieldOff,
  DollarSign,
  Bell,
  FileText,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { membroService } from '../services/membroService';
import { motoService } from '../services/motoService';
import { mensalidadeService } from '../services/mensalidadeService';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { Membro, STATUS_STYLES } from '../types/database.types';
import { handleSupabaseError } from '../utils/errorHandler';
import BentoCard from '../components/membros/BentoCard';
import EditMemberGeneralModal from '../components/membros/EditMemberGeneralModal';
import MotoModal from '../components/membros/MotoModal';
import FamiliaModal from '../components/membros/FamiliaModal';
import StatusBadge from '../components/mensalidades/StatusBadge';

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

export default function ManageMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [showConjugeModal, setShowConjugeModal] = useState(false);
  const [showFilhoModal, setShowFilhoModal] = useState(false);
  
  // Motos
  const [motos, setMotos] = useState<MotoData[]>([]);
  const [editingMoto, setEditingMoto] = useState<MotoData | null>(null);
  
  // Família
  const [conjuge, setConjuge] = useState<ConjugeData | null>(null);
  const [filhos, setFilhos] = useState<FilhoData[]>([]);
  const [editingFilho, setEditingFilho] = useState<FilhoData | null>(null);
  
  // Cargos
  const [todosOsCargos, setTodosOsCargos] = useState<Array<{ id: string; nome: string; tipo_cargo: string; nivel: number }>>([]);
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
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
      // Carregar membro usando service
      const membroComCargos = await membroService.buscarPorId(id);
      
      if (!membroComCargos) {
        console.error('Membro não encontrado com ID:', id);
        toastError('Membro não encontrado');
        navigate('/manage-members');
        return;
      }
      
      // Extrair apenas os campos do membro
      const membroLimpo: Membro = {
        id: membroComCargos.id,
        user_id: membroComCargos.user_id,
        nome_completo: membroComCargos.nome_completo,
        nome_guerra: membroComCargos.nome_guerra,
        padrinho_id: membroComCargos.padrinho_id,
        status_membro: membroComCargos.status_membro,
        numero_carteira: membroComCargos.numero_carteira,
        data_inicio: membroComCargos.data_inicio,
        telefone: membroComCargos.telefone,
        email: membroComCargos.email,
        endereco_cidade: membroComCargos.endereco_cidade,
        endereco_estado: membroComCargos.endereco_estado,
        foto_url: membroComCargos.foto_url,
        tipo_sanguineo: membroComCargos.tipo_sanguineo,
        ativo: membroComCargos.ativo,
        is_admin: membroComCargos.is_admin,
        created_at: membroComCargos.created_at,
        updated_at: membroComCargos.updated_at,
        padrinho: membroComCargos.padrinho || null
      };
      
      setMembro(membroLimpo);

      // Carregar cargos atuais
      const cargosAtuaisIds = membroComCargos.cargos.map((c) => c.id);
      setCargosSelecionados(cargosAtuaisIds);

      // Carregar motos usando service
      try {
        const motosData = await motoService.buscarPorMembroId(id);
        setMotos(motosData);
      } catch (error) {
        const appError = handleSupabaseError(error);
        console.error('Erro ao carregar motos:', appError);
        toastError(`Erro ao carregar motos: ${appError.message}`);
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

      // Carregar mensalidades usando service
      try {
        const mensalidadesData = await mensalidadeService.buscarPorMembroId(id);
        // Limitar às últimas 12
        setMensalidades(mensalidadesData.slice(0, 12));
      } catch (error) {
        const appError = handleSupabaseError(error);
        console.error('Erro ao carregar mensalidades:', appError);
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

  // Funções de Moto
  const handleSaveMoto = async (data: Omit<MotoData, 'id'>) => {
    if (!id) return;

    setSaving(true);
    try {
      if (editingMoto) {
        const { error } = await supabase
          .from('motos')
          .update({
            modelo: data.modelo,
            marca: data.marca,
            placa: data.placa.toUpperCase(),
            ano: data.ano,
            ativa: data.ativa
          })
          .eq('id', editingMoto.id);

        if (error) throw error;
        toastSuccess('Moto atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('motos')
          .insert({
            membro_id: id,
            modelo: data.modelo,
            marca: data.marca,
            placa: data.placa.toUpperCase(),
            ano: data.ano,
            ativa: data.ativa
          });

        if (error) throw error;
        toastSuccess('Moto cadastrada com sucesso!');
      }

      setShowMotoModal(false);
      setEditingMoto(null);
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
  const handleSaveConjuge = async (data: Omit<ConjugeData, 'id'>) => {
    if (!id) return;

    setSaving(true);
    try {
      if (conjuge) {
        const { error } = await supabase
          .from('conjuges')
          .update({
            nome_completo: data.nome_completo,
            nome_guerra: data.nome_guerra || null,
            data_nascimento: data.data_nascimento
          })
          .eq('id', conjuge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conjuges')
          .insert({
            membro_id: id,
            nome_completo: data.nome_completo,
            nome_guerra: data.nome_guerra || null,
            data_nascimento: data.data_nascimento
          });

        if (error) throw error;
      }

      setShowConjugeModal(false);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar cônjuge:', error);
      toastError('Erro ao salvar cônjuge. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFilho = async (data: Omit<FilhoData, 'id'>) => {
    if (!id) return;

    setSaving(true);
    try {
      if (editingFilho) {
        const { error } = await supabase
          .from('filhos')
          .update({
            nome_completo: data.nome_completo,
            nome_guerra: data.nome_guerra || null,
            data_nascimento: data.data_nascimento
          })
          .eq('id', editingFilho.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('filhos')
          .insert({
            membro_id: id,
            nome_completo: data.nome_completo,
            nome_guerra: data.nome_guerra || null,
            data_nascimento: data.data_nascimento
          });

        if (error) throw error;
      }

      setShowFilhoModal(false);
      setEditingFilho(null);
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

  if (!membro) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-4">
            Membro não encontrado
          </p>
          <Link
            to="/manage-members"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciar Integrantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/manage-members"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciar Integrantes
          </Link>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {membro.nome_guerra}
                </h1>
                <p className="text-gray-400 text-lg mb-4">{membro.nome_completo}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {membro.is_admin && (
                    <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                  {!membro.ativo && (
                    <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
                      Inativo
                    </span>
                  )}
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[membro.status_membro].bg} ${STATUS_STYLES[membro.status_membro].text}`}>
                    {membro.status_membro}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleToggleAdmin}
                  className={`${
                    membro.is_admin
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  } p-2 rounded-lg transition flex items-center justify-center`}
                  title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                >
                  {membro.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleAtivo}
                  className={`${
                    membro.ativo
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } px-4 py-2 rounded-lg transition text-sm`}
                >
                  {membro.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Motos */}
          <BentoCard
            title={`MOTOS (${motos.length})`}
            icon={<Bike className="w-5 h-5" />}
            headerAction={
              <button
                onClick={() => {
                  setEditingMoto(null);
                  setShowMotoModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-lg transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            }
          >
            {motos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Nenhuma moto cadastrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {motos.map((moto) => (
                  <div key={moto.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white text-sm font-semibold mb-1">
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
                            setShowMotoModal(true);
                          }}
                          className="text-gray-400 hover:text-blue-500 transition p-1"
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
          </BentoCard>

          {/* Família */}
          <BentoCard
            title="NÚCLEO FAMILIAR"
            icon={<Users className="w-5 h-5" />}
            colSpan={2}
          >
            <div className="space-y-6">
              {/* Cônjuge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Cônjuge
                  </h3>
                  {!conjuge && (
                    <button
                      onClick={() => setShowConjugeModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-lg transition"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Adicionar
                    </button>
                  )}
                </div>

                {conjuge && (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
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
                          onClick={() => setShowConjugeModal(true)}
                          className="text-gray-400 hover:text-blue-500 transition p-1"
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
              </div>

              {/* Filhos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    Filhos ({filhos.length})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingFilho(null);
                      setShowFilhoModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Adicionar
                  </button>
                </div>

                {filhos.length > 0 && (
                  <div className="space-y-2">
                    {filhos.map((filho) => (
                      <div key={filho.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
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
                                setShowFilhoModal(true);
                              }}
                              className="text-gray-400 hover:text-blue-500 transition p-1"
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
              </div>
            </div>
          </BentoCard>

          {/* Mensalidades */}
          <BentoCard
            title={`MENSALIDADES (${mensalidades.length})`}
            icon={<DollarSign className="w-5 h-5" />}
            headerAction={
              <Link
                to="/manage-payments"
                className="text-gray-400 hover:text-white text-xs transition"
              >
                Ver todas
              </Link>
            }
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mensalidades.length === 0 ? (
                <p className="text-gray-500 text-xs">Nenhuma mensalidade encontrada</p>
              ) : (
                mensalidades.slice(0, 5).map((mensalidade) => (
                  <div key={mensalidade.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
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
                      <StatusBadge status={mensalidade.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </BentoCard>

          {/* Comunicados Não Lidos */}
          <BentoCard
            title={`COMUNICADOS NÃO LIDOS (${comunicadosNaoLidos.length})`}
            icon={<Bell className="w-5 h-5" />}
            headerAction={
              <Link
                to="/comunicados"
                className="text-gray-400 hover:text-white text-xs transition"
              >
                Ver todos
              </Link>
            }
          >
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
                    <div key={comunicado.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
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
          </BentoCard>

          {/* Enquetes Não Respondidas */}
          <BentoCard
            title={`ENQUETES NÃO RESPONDIDAS (${enquetesNaoRespondidas.length})`}
            icon={<ClipboardList className="w-5 h-5" />}
            headerAction={
              <Link
                to="/polls"
                className="text-gray-400 hover:text-white text-xs transition"
              >
                Ver todas
              </Link>
            }
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enquetesNaoRespondidas.length === 0 ? (
                <p className="text-gray-500 text-xs">Nenhuma enquete não respondida</p>
              ) : (
                enquetesNaoRespondidas.slice(0, 5).map((enquete) => {
                  const encerramento = new Date(enquete.data_encerramento);
                  const hoje = new Date();
                  const diasRestantes = Math.ceil((encerramento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={enquete.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
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
          </BentoCard>

          {/* Documentos Não Acessados */}
          <BentoCard
            title={`DOCUMENTOS NÃO ACESSADOS (${documentosNaoAcessados.length})`}
            icon={<FileText className="w-5 h-5" />}
            headerAction={
              <Link
                to="/documentos"
                className="text-gray-400 hover:text-white text-xs transition"
              >
                Ver todos
              </Link>
            }
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documentosNaoAcessados.length === 0 ? (
                <p className="text-gray-500 text-xs">Nenhum documento não acessado</p>
              ) : (
                documentosNaoAcessados.slice(0, 5).map((documento) => (
                  <div key={documento.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
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
          </BentoCard>
        </div>

        {/* Modais */}
        <EditMemberGeneralModal
          membro={membro}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={carregarDados}
          padrinhosDisponiveis={padrinhosDisponiveis}
          todosOsCargos={todosOsCargos}
          cargosSelecionados={cargosSelecionados}
          onCargosChange={setCargosSelecionados}
        />

        <MotoModal
          isOpen={showMotoModal}
          onClose={() => {
            setShowMotoModal(false);
            setEditingMoto(null);
          }}
          onSave={handleSaveMoto}
          moto={editingMoto}
          saving={saving}
        />

        <FamiliaModal
          isOpen={showConjugeModal}
          onClose={() => setShowConjugeModal(false)}
          onSave={handleSaveConjuge}
          pessoa={conjuge}
          tipo="conjuge"
          saving={saving}
        />

        <FamiliaModal
          isOpen={showFilhoModal}
          onClose={() => {
            setShowFilhoModal(false);
            setEditingFilho(null);
          }}
          onSave={handleSaveFilho}
          pessoa={editingFilho}
          tipo="filho"
          saving={saving}
        />
      </div>
    </div>
  );
}

