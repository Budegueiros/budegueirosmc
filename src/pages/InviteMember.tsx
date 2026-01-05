import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, CheckCircle, AlertCircle, Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function InviteMember() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Obter a sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      // Chamar a Edge Function para enviar o convite
      const response = await fetch(
        `https://qrksozrkfldqqiibyhsv.supabase.co/functions/v1/invite-member`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            redirectTo: `${window.location.origin}/accept-invite`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite');
      }

      setSuccess(`Convite enviado com sucesso para ${email}!`);
      setEmail('');
    } catch (err: any) {
      console.error('Erro ao enviar convite:', err);
      setError(err.message || 'Erro ao enviar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-brand-red transition mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-oswald uppercase text-sm">Voltar</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-brand-red" />
            <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
              Convidar Integrante
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Envie um convite para um novo integrante se juntar ao Budegueiros MC
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="bg-green-950/30 border border-green-600/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{success}</p>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-950/30 border border-brand-red/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 md:p-8">
          <form onSubmit={handleInvite} className="space-y-5">
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                Email do Novo Membro
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/50">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] disabled:opacity-50"
                  placeholder="novo.membro@email.com"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                O integrante receberá um email com um link para aceitar o convite e criar sua conta
              </p>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando Convite...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Convite
                </>
              )}
            </button>

          </form>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-brand-dark/50 border border-brand-red/20 rounded-xl p-6">
          <h3 className="text-white font-oswald text-lg uppercase font-bold mb-3">
            Como Funciona
          </h3>
          <ol className="space-y-2 text-gray-400 text-sm">
            <li className="flex gap-3">
              <span className="text-brand-red font-bold">1.</span>
              <span>O novo integrante receberá um email com um link de convite</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-red font-bold">2.</span>
              <span>Ao clicar no link, ele será direcionado para criar uma senha</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-red font-bold">3.</span>
              <span>Após definir a senha, ele completará o perfil com dados pessoais e da moto</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-red font-bold">4.</span>
              <span>Pronto! Ele terá acesso completo à área do integrante</span>
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
}
