import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há um token de recuperação na URL
    const checkRecoveryToken = async () => {
      try {
        // O Supabase automaticamente processa o token do hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError('Link de recuperação inválido ou expirado.');
          setValidatingToken(false);
          return;
        }

        setValidatingToken(false);
      } catch (err) {
        setError('Erro ao validar o link de recuperação.');
        setValidatingToken(false);
      }
    };

    checkRecoveryToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Validando link de recuperação...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20">
        <div className="max-w-md w-full text-center">
          <div className="bg-brand-gray border border-green-600/50 rounded-xl p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-white font-oswald text-2xl uppercase font-bold mb-2">
              Senha Redefinida!
            </h2>
            <p className="text-gray-300 text-sm">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
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
            Nova Senha
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Defina uma nova senha para sua conta
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
            
            {/* Nova Senha */}
            <div>
              <label htmlFor="password" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] disabled:opacity-50"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            {/* Indicador de Força da Senha */}
            {password.length > 0 && (
              <div className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-brand-gray rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        password.length < 6 
                          ? 'w-1/3 bg-red-500' 
                          : password.length < 10 
                          ? 'w-2/3 bg-yellow-500' 
                          : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-gray-500">
                  {password.length < 6 
                    ? 'Senha fraca' 
                    : password.length < 10 
                    ? 'Senha média' 
                    : 'Senha forte'}
                </p>
              </div>
            )}

            {/* Botão de Redefinir */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </button>

          </form>

        </div>

        {/* Link para Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Lembrou sua senha?{' '}
            <a href="/login" className="text-brand-red hover:underline">
              Fazer login
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
