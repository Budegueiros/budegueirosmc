import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, User, Loader2, Users, Shield } from 'lucide-react';
import { GiFullMotorcycleHelmet } from 'react-icons/gi';
import { FaMoneyBillAlt } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatusMembroEnum } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';

interface MembroData {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  status_membro: StatusMembroEnum;
  foto_url: string | null;
  data_inicio: string;
  numero_carteira: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  conjuge?: {
    nome_completo: string;
  } | null;
  cargos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface MotoData {
  id: string;
  modelo: string;
  marca: string;
  placa: string;
  ano: number;
}

interface EventoData {
  id: string;
  nome: string;
  data_evento: string;
  local_saida: string;
  cidade: string;
  estado: string;
  distancia_km: number | null;
  descricao?: string;
}

interface MensalidadeData {
  id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Aberto';
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [membro, setMembro] = useState<MembroData | null>(null);
  const [motos, setMotos] = useState<MotoData[]>([]);
  const [proximoEvento, setProximoEvento] = useState<EventoData | null>(null);
  const [mensalidadesPendentes, setMensalidadesPendentes] = useState<MensalidadeData[]>([]);
  const [mensalidadesAtrasadas, setMensalidadesAtrasadas] = useState<MensalidadeData[]>([]);
  const [confirmados, setConfirmados] = useState(0);
  const [confirmacaoId, setConfirmacaoId] = useState<string | null>(null);
  const [confirmandoPresenca, setConfirmandoPresenca] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarregar dados sempre que a página for montada/exibida
  useEffect(() => {
    const handleFocus = () => {
      carregarDados();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarDados = async () => {
    if (!user) return;

    try {
      // Buscar dados do membro com seus cargos ativos
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
          ),
          conjuges (
            nome_completo
          )
        `)
        .eq('user_id', user.id)
        .eq('membro_cargos.ativo', true)
        .single();

      // Se não encontrou o membro, redirecionar para completar perfil
      if (membroError || !membroData) {
        navigate('/complete-profile');
        return;
      }

      // Transformar dados para incluir apenas cargos ativos
      const membroComCargos = {
        ...membroData,
        cargos: membroData.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos) || [],
        conjuge: membroData.conjuges && membroData.conjuges.length > 0 ? membroData.conjuges[0] : null
      };

      setMembro(membroComCargos);

      // Buscar motos ativas do membro
      if (membroData) {
        const { data: motosData } = await supabase
          .from('motos')
          .select('*')
          .eq('membro_id', membroData.id)
          .eq('ativa', true)
          .order('created_at', { ascending: false });

        setMotos(motosData || []);

        // Buscar próximo evento
        const { data: eventoData } = await supabase
          .from('eventos')
          .select('*')
          .eq('status', 'Ativo')
          .gte('data_evento', new Date().toISOString().split('T')[0])
          .order('data_evento', { ascending: true })
          .limit(1)
          .single();

        setProximoEvento(eventoData);

        // Buscar confirmados do evento
        if (eventoData) {
          const { count } = await supabase
            .from('confirmacoes_presenca')
            .select('*', { count: 'exact', head: true })
            .eq('evento_id', eventoData.id)
            .eq('status', 'Confirmado');

          setConfirmados(count || 0);

          // Verificar se o usuário já confirmou presença neste evento
          const { data: minhaConfirmacao } = await supabase
            .from('confirmacoes_presenca')
            .select('id')
            .eq('evento_id', eventoData.id)
            .eq('membro_id', membroData.id)
            .eq('status', 'Confirmado')
            .maybeSingle();

          setConfirmacaoId(minhaConfirmacao?.id || null);
        }

        // Buscar mensalidades pendentes e atrasadas
        const hoje = new Date();
        const { data: mensalidadesData, error: mensalidadesError } = await supabase
          .from('mensalidades')
          .select('*')
          .eq('membro_id', membroData.id)
          .neq('status', 'Pago')
          .order('mes_referencia', { ascending: true });

        if (!mensalidadesError && mensalidadesData) {
          // Separar pendentes e atrasadas baseado na data de vencimento
          const atrasadas = mensalidadesData.filter(m => {
            const vencimento = new Date(m.data_vencimento);
            return vencimento < hoje;
          });

          const pendentes = mensalidadesData.filter(m => {
            const vencimento = new Date(m.data_vencimento);
            return vencimento >= hoje;
          });

          setMensalidadesAtrasadas(atrasadas);
          setMensalidadesPendentes(pendentes);
        } else if (mensalidadesError) {
          console.error('Erro ao buscar mensalidades:', mensalidadesError);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmarPresenca = async () => {
    if (!membro || !proximoEvento || confirmandoPresenca) return;

    setConfirmandoPresenca(true);

    try {
      if (confirmacaoId) {
        // Usuário já confirmou - cancelar confirmação
        const { error } = await supabase
          .from('confirmacoes_presenca')
          .delete()
          .eq('id', confirmacaoId);

        if (error) throw error;

        setConfirmacaoId(null);
        setConfirmados(prev => Math.max(0, prev - 1));
      } else {
        // Criar nova confirmação
        const { data, error } = await supabase
          .from('confirmacoes_presenca')
          .insert({
            evento_id: proximoEvento.id,
            membro_id: membro.id,
            status: 'Confirmado',
            data_confirmacao: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;

        setConfirmacaoId(data.id);
        setConfirmados(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      alert('Erro ao processar confirmação. Tente novamente.');
    } finally {
      setConfirmandoPresenca(false);
    }
  };

  const formatarData = (data: string) => {
    // Adiciona 'T00:00:00' para garantir que seja interpretado como horário local
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
  };

  // Se não tem dados do membro, redirecionar para completar perfil
  if (!loading && !membro && user) {
    navigate('/complete-profile');
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
              Carregando seus dados...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!membro) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner de Alerta - Full Width */}
        {mensalidadesAtrasadas.length > 0 && (
          <div className="bg-red-950/50 border-2 border-brand-red rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-brand-red/20 p-3 rounded-lg">
                  <FaMoneyBillAlt className="w-8 h-8 text-brand-red" />
                </div>
                <div>
                  <h3 className="text-white font-oswald text-2xl uppercase font-bold">
                    MENSALIDADE EM ATRASO
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Você possui {mensalidadesAtrasadas.length} mensalidade pendente. Regularize agora para evitar bloqueio.
                  </p>
                </div>
              </div>
              <Link
                to="/my-payments"
                className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-oswald uppercase font-bold text-sm transition hover:scale-105 transform"
              >
                Ver Mensalidades
              </Link>
            </div>
          </div>
        )}

        {/* Grid Principal: Card de Perfil + Mensalidades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Perfil - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-4 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                {/* Foto */}
                <div className="relative flex-shrink-0 mx-auto lg:mx-0">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center overflow-hidden">
                    {membro.foto_url ? (
                      <img src={membro.foto_url} alt={membro.nome_guerra} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-4xl lg:text-6xl font-bold">{membro.nome_guerra[0]}</span>
                    )}
                  </div>
                </div>

                {/* Informações */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 lg:mb-4">
                    <div className="text-center lg:text-left">
                      <h2 className="text-white font-oswald text-3xl lg:text-5xl uppercase font-bold leading-none">
                        {membro.nome_guerra}
                      </h2>
                      <p className="text-gray-400 text-base lg:text-lg mt-1">{membro.endereco_cidade || 'Brasiliado'}</p>
                    </div>
                    <Link to="/edit-profile" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm justify-center lg:justify-start mt-2 lg:mt-0">
                      <User className="w-4 h-4" />
                      Editar Perfil
                    </Link>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4 lg:mb-6 justify-center lg:justify-start">
                    {membro.endereco_estado && (
                      <span className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs font-oswald uppercase">
                        {membro.endereco_estado}
                      </span>
                    )}
                    {membro.cargos && membro.cargos.map((cargo) => (
                      <span key={cargo.id} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs font-oswald uppercase">
                        {cargo.nome}
                      </span>
                    ))}
                  </div>

                  {/* Informações Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="uppercase">Localização</span>
                      </div>
                      <p className="text-white font-semibold text-sm lg:text-base">
                        {membro.endereco_cidade && membro.endereco_estado
                          ? `${membro.endereco_cidade} - ${membro.endereco_estado}`
                          : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="uppercase">Membro desde</span>
                      </div>
                      <p className="text-white font-semibold text-sm lg:text-base">{formatarData(membro.data_inicio)}</p>
                    </div>
                    {membro.conjuge && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                          <Users className="w-4 h-4" />
                          <span className="uppercase">Cônjuge</span>
                        </div>
                        <p className="text-white font-semibold text-sm lg:text-base">{membro.conjuge.nome_completo}</p>
                      </div>
                    )}
                    <div className={membro.conjuge ? '' : 'lg:col-span-2'}>
                      <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="uppercase">Nº Membro</span>
                      </div>
                      <p className="text-brand-red font-mono font-bold text-base lg:text-lg">{membro.numero_carteira}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mensalidades - 1 coluna */}
          <div>
            {/* Card de Mensalidades */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
                <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
                  <FaMoneyBillAlt className="w-5 h-5 text-brand-red" />
                  MENSALIDADES
                </h3>
              </div>

              {/* Conteúdo */}
              <div className="p-5">
                {/* Tabela de Mensalidades */}
                <div className="space-y-2">
                  {/* Header da Tabela */}
                  <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-800 text-gray-500 text-xs uppercase">
                    <div className="col-span-4">Mês/Ano</div>
                    <div className="col-span-3">Vencimento</div>
                    <div className="col-span-3 text-right">Valor</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  {/* Mensalidades Atrasadas */}
                  {mensalidadesAtrasadas.slice(0, 1).map((mensalidade) => {
                    const mesAno = new Date(mensalidade.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    const vencimento = new Date(mensalidade.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    return (
                      <div key={mensalidade.id} className="grid grid-cols-12 gap-2 py-2 text-sm border-b border-gray-800/50">
                        <div className="col-span-4 text-white capitalize font-medium">{mesAno.split(' ')[0]} {mesAno.split(' ')[1]}</div>
                        <div className="col-span-3 text-gray-400">{vencimento}</div>
                        <div className="col-span-3 text-right text-white font-semibold">R$ {mensalidade.valor.toFixed(2)}</div>
                        <div className="col-span-2 text-right">
                          <span className="inline-flex items-center gap-1 bg-red-950/50 text-brand-red px-2 py-0.5 rounded text-xs font-bold">
                            ATRASADO
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Últimas mensalidades pagas */}
                  {mensalidadesPendentes.slice(0, 3).map((mensalidade) => {
                    const mesAno = new Date(mensalidade.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    const vencimento = new Date(mensalidade.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    return (
                      <div key={mensalidade.id} className="grid grid-cols-12 gap-2 py-2 text-sm border-b border-gray-800/50">
                        <div className="col-span-4 text-white capitalize font-medium">{mesAno.split(' ')[0]} {mesAno.split(' ')[1]}</div>
                        <div className="col-span-3 text-gray-400">{vencimento}</div>
                        <div className="col-span-3 text-right text-white font-semibold">R$ {mensalidade.valor.toFixed(2)}</div>
                        <div className="col-span-2 text-right">
                          <span className="inline-flex items-center gap-1 bg-green-950/50 text-green-500 px-2 py-0.5 rounded text-xs font-bold">
                            PAGO
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Link Ver Tudo */}
                <Link to="/my-payments" className="block text-center text-brand-red hover:text-red-400 font-oswald text-sm uppercase font-bold mt-6 transition">
                  Ver Todo Histórico
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Inferior: Próximo Role + Minha Máquina */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Próximo Role */}
          <div className="h-full">
            {proximoEvento ? (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
                  <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-red" />
                    PRÓXIMO ROLE
                  </h3>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Título e Data Lado a Lado */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    {/* Nome do Evento */}
                    <h4 className="text-white font-oswald text-2xl uppercase font-bold flex-1">
                      {proximoEvento.nome}
                    </h4>

                    {/* Data Grande à Direita */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-brand-red font-oswald text-4xl font-bold leading-none">
                        {new Date(proximoEvento.data_evento).getDate()}
                      </div>
                      <div className="text-gray-400 font-oswald text-xs uppercase">
                        {new Date(proximoEvento.data_evento).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Local */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          {proximoEvento.local_saida}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {proximoEvento.cidade}/{proximoEvento.estado}
                        </p>
                      </div>
                    </div>
                    <Link to="/agenda" className="flex items-center gap-2 text-gray-400 hover:text-brand-red transition text-xs">
                      <MapPin className="w-4 h-4" />
                      VER NO MAPA
                    </Link>
                  </div>

                  {/* Confirmados */}
                  <div className="flex items-center gap-2 mb-5 text-gray-400 text-sm">
                    <Users className="w-5 h-5" />
                    <span>{confirmados} irmãos confirmados</span>
                  </div>

                  {/* Spacer para empurrar o botão para baixo */}
                  <div className="flex-grow"></div>

                  {/* Botão de Confirmação */}
                  <button
                    onClick={handleConfirmarPresenca}
                    disabled={confirmandoPresenca}
                    className={`w-full font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition ${confirmacaoId
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-brand-red hover:bg-red-700 text-white'
                      } disabled:opacity-50`}
                  >
                    {confirmandoPresenca ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Processando...
                      </>
                    ) : confirmacaoId ? (
                      'PRESENÇA CONFIRMADA'
                    ) : (
                      'CONFIRMAR PRESENÇA'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center">
                <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Nenhum evento programado</p>
              </div>
            )}
          </div>

          {/* Minhas Máquinas */}
          <div className="h-full">
            {motos.length > 0 ? (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
                  <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
                    <GiFullMotorcycleHelmet className="w-5 h-5 text-brand-red" />
                    {motos.length > 1 ? 'MINHAS MÁQUINAS' : 'MINHA MÁQUINA'}
                  </h3>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Lista de Motos */}
                  <div className="space-y-2 mb-5 flex-1 overflow-y-auto">
                    {motos.map((moto, index) => (
                      <div key={moto.id} className="flex items-center justify-between py-3 border-b border-gray-800 hover:bg-gray-800/30 transition px-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">{index + 1}.</span>
                            <div>
                              <h4 className="text-white font-oswald text-sm uppercase font-bold">
                                {moto.marca} {moto.modelo}
                              </h4>
                              <p className="text-gray-400 text-xs">
                                <span className="font-mono">{moto.placa}</span> • {moto.ano}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/edit-moto/${moto.id}`}
                          className="text-gray-400 hover:text-brand-red transition text-xs uppercase font-oswald font-bold"
                        >
                          Editar
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Botão Adicionar Nova Moto */}
                  <Link
                    to="/add-moto"
                    className="block w-full bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red text-brand-red hover:text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition text-center"
                  >
                    + Cadastrar Nova Moto
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-8 text-center h-full flex flex-col items-center justify-center">
                <GiFullMotorcycleHelmet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">Nenhuma moto cadastrada</p>
                <Link
                  to="/add-moto"
                  className="bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
                >
                  Cadastrar Moto
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

