import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { validateBeforeSend } from '../utils/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar dados antes de enviar
      const validation = validateBeforeSend(email, password);
      
      if (!validation.isValid) {
        setError(validation.errors.join(' '));
        setLoading(false);
        return;
      }
      
      // Log dos dados validados (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.log('✅ Dados validados antes do envio:', {
          email: validation.data?.email,
          passwordLength: validation.data?.password.length,
          hasWarnings: validation.warnings.length > 0,
          warnings: validation.warnings,
        });
      }
      
      // Enviar dados validados
      await signIn(validation.data!.email, validation.data!.password);
      navigate('/dashboard');
    } catch (err: any) {
      // Usar a mensagem de erro traduzida do AuthContext
      const errorMessage = err.message || 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
      setError(errorMessage);
      
      // Log do erro completo para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.error('Erro de autenticação:', {
          message: err.message,
          status: err.status,
          originalError: err.originalError,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-24">
      <div className="max-w-md w-full">
        
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/BT.png" alt="Budegueiros MC" className="w-20 h-auto" />
          </div>
          <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
            Área do Integrante
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Acesso exclusivo para integrantes da irmandade
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
                Email
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

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                Senha
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
                  className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar na Área do Integrante'
              )}
            </button>

          </form>

          {/* Link de Recuperação de Senha */}
          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-gray-400 text-sm hover:text-brand-red transition">
              Esqueceu sua senha?
            </a>
          </div>

        </div>

        {/* Mensagem de Ajuda */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Problemas para acessar?{' '}
            <a href="/contato" className="text-brand-red hover:underline">
              Entre em contato
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
