import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // Detectar se é um link de convite e redirecionar para /accept-invite
        // Ou se é um link de recovery e redirecionar para /reset-password
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');

        if (type === 'invite' && accessToken) {
            // Manter o hash e redirecionar
            navigate(`/accept-invite${hash}`);
        } else if (type === 'recovery' && accessToken) {
            // Redirecionar para reset-password mantendo o hash
            navigate(`/reset-password${hash}`);
        }
    }, [navigate]);

    return (
        <section id="home" className="relative h-screen w-full overflow-hidden bg-brand-dark pt-20 md:pt-0">
            {/* Background com Caveira (apenas desktop) */}
            <div 
                className="hidden md:block absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(/brasao.jpg)`,
                    backgroundSize: '37%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
                }}
            />

            {/* Conteúdo Principal */}
            <div className="relative z-40 h-full flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:pl-32 lg:pl-48 py-8 md:py-0">
                {/* Brasão no Mobile - acima do texto */}
                <div className="md:hidden mb-8 flex-shrink-0 relative z-40">
                    <img 
                        src="/brasao.jpg" 
                        alt="Brasão Budegueiros MC" 
                        className="w-48 h-48 object-contain opacity-80"
                    />
                </div>

                <div className="max-w-2xl px-4 md:px-8 text-center md:text-left">
                    {/* Título Principal */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-oswald font-bold leading-tight mb-6">
                        <span className="text-white">MUITO MAIS QUE ESTRADA:</span>
                        <br />
                        <span className="text-brand-red">SOMOS FAMÍLIA SOBRE DUAS RODAS</span>
                    </h1>

                    {/* Descrição */}
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                        Fundado em 14/04/2024, o <span className="text-brand-red font-semibold">BUDEGUEIROS MC</span> é movido por liberdade, respeito e irmandade. Junte-se a nós nessa jornada sem fim.
                    </p>

                    {/* Botão CTA */}
                    <Link 
                        to="/contato"
                        className="inline-block bg-brand-red hover:bg-red-700 text-white font-oswald font-bold text-lg uppercase tracking-wider px-8 py-4 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-brand-red/50"
                    >
                        Seja Integrante
                    </Link>
                </div>
            </div>

            {/* Decoração: Linha Inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-50" />
        </section>
    )
}