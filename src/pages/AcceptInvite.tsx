import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AcceptInvite() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há um token de convite na URL
    const checkInviteToken = async () => {
      try {
        // O Supabase automaticamente processa o token do hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError('Link de convite inválido ou expirado.');
          setValidatingToken(false);
          return;
        }

        // Verificar se é um convite (usuário ainda não definiu senha)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.email) {
          setInviteValid(true);
          setValidatingToken(false);
        } else {
          setError('Sessão inválida.');
          setValidatingToken(false);
        }
      } catch (err) {
        setError('Erro ao validar o convite.');
        setValidatingToken(false);
      }
    };

    checkInviteToken();
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
      // Atualizar a senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Redirecionar para completar o perfil
      navigate('/complete-profile');

    } catch (err: any) {
      setError(err.message || 'Erro ao configurar sua conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Validando convite...
          </p>
        </div>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-brand-gray border border-brand-red/50 rounded-xl p-8">
            <AlertCircle className="w-16 h-16 text-brand-red mx-auto mb-4" />
            <h2 className="text-white font-oswald text-2xl uppercase font-bold mb-2">
              Convite Inválido
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              {error || 'O link de convite está inválido ou expirado. Entre em contato com a diretoria.'}
            </p>
            <a
              href="/contato"
              className="inline-block bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
            >
              Entrar em Contato
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
            Bem-vindo à Irmandade!
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Configure sua senha para acessar a área do membro
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
                Escolha sua Senha
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
                Confirmar Senha
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
                    ? 'Senha fraca - adicione mais caracteres' 
                    : password.length < 10 
                    ? 'Senha média - considere adicionar mais caracteres' 
                    : 'Senha forte!'}
                </p>
              </div>
            )}

            {/* Botão de Aceitar Convite */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Configurando...
                </>
              ) : (
                'Aceitar Convite e Continuar'
              )}
            </button>

            {/* Informação adicional */}
            <div className="bg-brand-dark/50 border border-brand-red/20 rounded-lg p-4 mt-4">
              <p className="text-gray-400 text-xs leading-relaxed">
                Após definir sua senha, você será direcionado para completar seus dados pessoais e cadastrar sua moto.
              </p>
            </div>

          </form>

        </div>

        {/* Link de Ajuda */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Problemas com o convite?{' '}
            <a href="/contato" className="text-brand-red hover:underline">
              Entre em contato
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
