import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const COMUNICADO_EXPIRA_EM = new Date('2026-08-11T23:59:59-03:00');

export default function Home() {
    const navigate = useNavigate();
    const [showComunicado, setShowComunicado] = useState(
        () => Date.now() <= COMUNICADO_EXPIRA_EM.getTime()
    );

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
        <section id="home" className="relative min-h-screen md:h-screen w-full overflow-x-hidden bg-brand-dark pt-20 md:pt-0">
            {showComunicado && (
                <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
                    <div className="relative mx-auto my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#9f6b4d]/70 bg-[#15110f] p-3 shadow-[0_0_60px_rgba(0,0,0,0.65)]">
                        <div className="rounded-[1.6rem] border border-[#5f4030] bg-[radial-gradient(circle_at_top,rgba(120,90,70,0.18),transparent_35%),linear-gradient(180deg,#1a1512_0%,#0d0b0a_100%)] p-6 text-center text-[#f0c6a7] md:p-8">
                            <button
                                type="button"
                                onClick={() => setShowComunicado(false)}
                                className="absolute right-6 top-6 rounded-full border border-[#9f6b4d]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-[#f0c6a7] transition hover:bg-[#9f6b4d]/10"
                            >
                                Fechar
                            </button>

                            <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border border-[#9f6b4d]/50 bg-black/30 p-2 shadow-lg md:h-36 md:w-36">
                                <img
                                    src="/brasao2.jpg"
                                    alt="Budegueiros MC"
                                    className="h-full w-full object-cover opacity-90"
                                />
                            </div>

                            <h2 className="mb-4 font-oswald text-3xl font-bold uppercase text-[#fff3ea] md:text-5xl">
                                Comunicado Oficial
                            </h2>

                            <div className="space-y-4 text-base font-semibold leading-snug md:text-2xl">
                                <p>
                                    O Moto Clube Budegueiros informa que o colete do nosso irmão Tatu foi furtado
                                    no último sábado, dia 01/08, no bairro Saudade.
                                </p>
                                <p>
                                    Solicitamos a atenção de todos os motoclubes, irmãos de estrada e demais pessoas
                                    de boa-fé para que, caso possuam qualquer informação que possa contribuir para a
                                    localização do referido colete, entrem em contato com a maior brevidade possível.
                                </p>
                                <p>
                                    Reforçamos que se trata de um item de uso pessoal e de representação do nosso grupo,
                                    cuja posse e circulação indevidas não são autorizadas.
                                </p>
                                <p>
                                    Sem mais para o momento, agradecemos a colaboração e o respeito de todos.
                                </p>
                            </div>

                            <div className="mt-6 text-lg font-bold leading-tight text-[#f6d0b6] md:text-2xl">
                                <p>Décio (Pinguin)</p>
                                <p>Presidente do Moto Clube Budegueiros</p>
                                <p>Telefone: (31) 99937-0691</p>
                            </div>

                            <div className="relative mx-auto mt-8 flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-[1.8rem] border border-[#6f4b38] bg-[linear-gradient(180deg,#342821_0%,#17110e_100%)] px-6 py-8 shadow-inner md:h-60">
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'url(/brasao.jpg)',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '80%',
                                    }}
                                />
                                <div className="absolute inset-y-6 left-6 w-6 rounded-full border border-[#9f6b4d]/40 bg-black/20" />
                                <div className="absolute inset-y-6 right-6 w-6 rounded-full border border-[#9f6b4d]/40 bg-black/20" />
                                <div className="relative flex h-full w-full items-center justify-center rounded-[1.5rem] border border-dashed border-[#b47b5c]/40 bg-black/25 px-4">
                                    <div className="-rotate-12 rounded-xl border-4 border-[#7a130f] bg-[#d31212]/90 px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
                                        <p className="text-5xl font-black uppercase leading-none text-black md:text-7xl">?</p>
                                        <p className="mt-2 text-3xl font-black uppercase tracking-wide text-[#1f0f0b] md:text-5xl">
                                            Procurado
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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