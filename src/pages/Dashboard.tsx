import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardProfile } from '../components/dashboard/DashboardProfile';
import { DashboardMensalidades } from '../components/dashboard/DashboardMensalidades';
import { ProximoEventoCard } from '../components/dashboard/ProximoEventoCard';
import { MinhasMaquinasCard } from '../components/dashboard/MinhasMaquinasCard';
import { MensalidadesAtrasadasAlert } from '../components/dashboard/MensalidadesAtrasadasAlert';
import ConfirmarPresencaModal from '../components/eventos/ConfirmarPresencaModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [presencaModalOpen, setPresencaModalOpen] = useState(false);
  
  const {
    membro,
    motos,
    proximoEvento,
    mensalidades,
    mensalidadesAtrasadas,
    kmAnual,
    confirmados,
    budegueiras,
    visitantes,
    confirmacaoId,
    loading,
    error,
    confirmarPresenca,
    confirmandoPresenca,
    recarregar,
  } = useDashboardData(user?.id);

  // Recarregar dados quando a página receber foco
  useEffect(() => {
    const handleFocus = () => {
      recarregar();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [recarregar]);

  // Tratar erros - usar ref para evitar mostrar o mesmo erro múltiplas vezes
  const errorRef = useRef<string | null>(null);
  const toastError = useCallback((message: string) => {
    toast.error(message);
  }, [toast]);
  
  useEffect(() => {
    if (error && error !== errorRef.current) {
      errorRef.current = error;
      toastError(error);
      // Limpar erro após mostrar para evitar loop
      setTimeout(() => {
        errorRef.current = null;
      }, 100);
    }
  }, [error, toastError]);

  // Tratar confirmação de presença com erro
  const handleConfirmarPresencaComErro = async () => {
    try {
      if (confirmacaoId) {
        await confirmarPresenca();
        return;
      }

      if (proximoEvento?.tipo_evento === 'Role') {
        setPresencaModalOpen(true);
        return;
      }

      await confirmarPresenca();
    } catch (err) {
      // Erro já foi logado no hook, apenas mostrar toast ao usuário
      toast.error('Erro ao processar confirmação. Tente novamente.');
    }
  };

  const handleConfirmarPresencaDetalhes = async (detalhes: { vaiComBudegueira: boolean; quantidadeVisitantes: number }) => {
    try {
      await confirmarPresenca(detalhes);
      setPresencaModalOpen(false);
    } catch (err) {
      toast.error('Erro ao processar confirmação. Tente novamente.');
    }
  };

  // Se não tem dados do membro, redirecionar para completar perfil
  useEffect(() => {
    if (!loading && !membro && user) {
      navigate('/complete-profile');
    }
  }, [loading, membro, user, navigate]);

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
          <MensalidadesAtrasadasAlert mensalidades={mensalidadesAtrasadas} />
        )}

        {/* Grid Principal: Card de Perfil + Mensalidades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Perfil */}
          <DashboardProfile membro={membro} />

          {/* Mensalidades - 1 coluna */}
          <DashboardMensalidades mensalidades={mensalidades} />
        </div>

        {/* Grid Inferior: Próximo Role + Minha Máquina */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Próximo Role */}
          <ProximoEventoCard
            evento={proximoEvento}
            confirmados={confirmados}
            budegueiras={budegueiras}
            visitantes={visitantes}
            membroId={membro.id}
            confirmacaoId={confirmacaoId}
            confirmandoPresenca={confirmandoPresenca}
            onConfirmarPresenca={handleConfirmarPresencaComErro}
          />

          {/* Minhas Máquinas */}
          <MinhasMaquinasCard motos={motos} kmAnual={kmAnual} />
        </div>
      </div>

      <ConfirmarPresencaModal
        isOpen={presencaModalOpen}
        onClose={() => setPresencaModalOpen(false)}
        onConfirm={handleConfirmarPresencaDetalhes}
        confirmando={confirmandoPresenca}
      />
    </DashboardLayout>
  );
}

