import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Home() {
    return (
        <section id="home" className="relative h-screen w-full overflow-hidden bg-brand-dark">
            {/* Barra Lateral Vermelha com Redes Sociais */}
            <div className="fixed left-0 top-0 h-full w-12 md:w-16 bg-brand-red z-40 flex flex-col items-center justify-between py-8">
                {/* Texto Vertical "BUDEGUEIROS" */}
                <div className="flex-1 flex items-center justify-center">
                    <span className="transform -rotate-90 origin-center text-white font-oswald font-bold text-sm md:text-base tracking-[0.3em] whitespace-nowrap">
                        BUDEGUEIROS
                    </span>
                </div>

                {/* Ícones Sociais */}
                <div className="flex flex-col gap-6 pb-4">
                    <a 
                        href="https://facebook.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:text-brand-dark transition"
                        aria-label="Facebook"
                    >
                        <Facebook className="w-5 h-5" />
                    </a>
                    <a 
                        href="https://www.instagram.com/budegueirosmc/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:text-brand-dark transition"
                        aria-label="Instagram"
                    >
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:text-brand-dark transition"
                        aria-label="Twitter"
                    >
                        <Twitter className="w-5 h-5" />
                    </a>
                </div>
            </div>

            {/* Background com Caveira (placeholder) */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{
                    backgroundImage: `url(/brasao.jpg)`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
                }}
            />

            {/* Conteúdo Principal */}
            <div className="relative z-10 h-full flex items-center justify-center md:justify-start pl-12 md:pl-32 lg:pl-48">
                <div className="max-w-3xl px-4 md:px-8">
                    {/* Título Principal */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-oswald font-bold leading-tight mb-6">
                        <span className="text-white">MUITO MAIS QUE ESTRADA:</span>
                        <br />
                        <span className="text-brand-red">SOMOS FAMÍLIA SOBRE DUAS RODAS</span>
                    </h1>

                    {/* Descrição */}
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                        Fundado em 14/04, o <span className="text-brand-red font-semibold">BUDEGUEIROS MC</span> é movido por liberdade, respeito e irmandade. Junte-se a nós nessa jornada sem fim.
                    </p>

                    {/* Botão CTA */}
                    <Link 
                        to="/contato"
                        className="inline-block bg-brand-red hover:bg-red-700 text-white font-oswald font-bold text-lg uppercase tracking-wider px-8 py-4 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-brand-red/50"
                    >
                        Seja Membro
                    </Link>
                </div>
            </div>

            {/* Decoração: Linha Inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-50" />
        </section>
    )
}