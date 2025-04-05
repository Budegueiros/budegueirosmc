import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Home() {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false,
    };

    const carouselImages = [
        "/winners.jpeg",
        "/cevaroli.png",
        "/acjur.jpeg",
        "bhvans.jpeg",
        "/construsampa.jpeg",
        "/oldrat.jpeg",
    ];

    const carouselAtracoes = [
        "/dive.jpeg",
        "/dive2.jpeg",
        "/djbros.jpeg"
    ];

    return (
        <section id="home" className="h-full pt-12 md:pt-0"> {/* Apenas pt-12 no mobile */}
            <div className="h-screen flex flex-col items-center justify-center"
                style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85) 11%, rgba(255,255,255,0.3) 44%, rgba(0,0,0,0.86) 87%),url(/familia.jpeg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                {/* Main title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4 bg-black/70 px-4 sm:px-8 py-3 sm:py-4 rounded-lg border-2 border-yellow-500">
                    1º ANIVERSÁRIO BUDEGUEIROS
                </h1>

                {/* Restante do código permanece igual... */}
                <div className='flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full px-4 max-w-6xl mx-auto'>
                    {/* Atrações - lado esquerdo */}
                    <div className='w-full md:w-1/2 flex flex-col items-center gap-4'>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center bg-red-600/90 px-3 sm:px-4 py-1 sm:py-2 rounded-lg shadow-md">
                            ATRAÇÕES
                        </h2>
                        <div className="w-full max-w-md aspect-video rounded-lg shadow-xl overflow-hidden relative">
                            <Slider {...settings}>
                                {carouselAtracoes.map((img, index) => (
                                    <div key={index} className="!flex items-center justify-center h-full">
                                        <div className="flex items-center justify-center h-full w-full p-2">
                                            <img
                                                src={img}
                                                alt={`Atração ${index + 1}`}
                                                className="max-h-full max-w-full object-contain border-4 border-yellow-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    </div>

                    {/* Patrocinadores - lado direito */}
                    <div className='w-full md:w-1/2 flex flex-col items-center gap-4'>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center bg-purple-600/90 px-3 sm:px-4 py-1 sm:py-2 rounded-lg shadow-md">
                            PATROCINADORES
                        </h2>
                        <div className="w-full max-w-md aspect-video rounded-lg shadow-xl overflow-hidden relative">
                            <Slider {...settings}>
                                {carouselImages.map((img, index) => (
                                    <div key={index} className="!flex items-center justify-center h-full">
                                        <div className="flex items-center justify-center h-full w-full p-2">
                                            <img
                                                src={img}
                                                alt={`Patrocinador ${index + 1}`}
                                                className="max-h-full max-w-full object-contain border-4 border-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    </div>
                </div>

                {/* Location information */}
                <div className="mt-4 mb-6 bg-black/70 p-3 sm:p-4 rounded-lg border border-white/30 text-center max-w-2xl mx-4">
                    <h2 className="text-lg sm:text-xl font-bold text-yellow-400 mb-1">LOCAL DO EVENTO</h2>
                    <p className="text-white text-base sm:text-lg">Av. Joaquim José Diniz, 787</p>
                    <p className="text-white text-sm sm:text-base">B. Fernão Dias - Belo Horizonte/MG</p>
                    <p className="text-yellow-300 mt-2 text-sm sm:text-base font-semibold">Domingo - A partir das 12h até as 18h</p>

                    {/* Additional information */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                        <p className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">CHURRASCO 0800 PARA COLETADOS</p>
                        <p className="text-yellow-300 font-medium text-sm sm:text-base">MCs: Tragam suas bandeiras!</p>
                        <p className="text-white mt-1 sm:mt-2 text-sm sm:text-base">Porções variadas • Chopp a preço justo</p>
                    </div>
                </div>
            </div>
        </section>
    )
}