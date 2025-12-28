import { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-24">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/BT.png" alt="Budegueiros MC" className="w-20 h-20" />
            </div>
          </div>

          <div className="bg-brand-gray border border-green-600/50 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-white font-oswald text-2xl uppercase font-bold mb-2">
              Email Enviado!
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Enviamos um link de recuperação para <strong className="text-white">{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <p className="text-gray-400 text-xs">
              O link expira em 1 hora.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="inline-flex items-center gap-2 text-brand-red hover:underline text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-24">
      <div className="max-w-md w-full">
        
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/BT.png" alt="Budegueiros MC" className="w-20 h-20" />
          </div>
          <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
            Recuperar Senha
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 md:p-8">
          
          {/* Alerta de Erro */}
          {error && (
            <div className="bg-red-950/30 border border-brand-red/50 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                Email Cadastrado
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
                  placeholder="seu@email.com"
                />
              </div>
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
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>

          </form>

        </div>

        {/* Link de Voltar */}
        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-red transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </a>
        </div>

      </div>
    </div>
  );
}
