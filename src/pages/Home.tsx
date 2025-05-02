import { useState, useEffect } from 'react';

export default function Home() {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const phrases = [
        "Unidos pela paixão das duas rodas e pela liberdade das estradas.",
        "Irmandade, respeito e paixão por motocicletas.",
        "Vivendo aventuras sobre duas rodas.",
        "Mais que um clube, uma família."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prevIndex) =>
                prevIndex === phrases.length - 1 ? 0 : prevIndex + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, []);
    return (
        <section id="home" className="h-full">
            <div className="h-screen flex flex-col items-center justify-center"
                style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85) 11%, rgba(255,255,255,0.3) 44%, rgba(0,0,0,0.86) 87%),url(/road-background.jpg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                <div className='flex flex-col items-center justify-center h-2/3'>
                    <div className='flex flex-col items-center justify-center p-4'>
                        <h1 className="text-4xl text-center lg:text-6xl font-bold mb-6 text-yellow-400 drop-shadow-2xl">
                            Budegueiros Moto Clube
                        </h1>
                        <p className="text-xl text-center mb-8 text-white drop-shadow-xl font-medium min-h-[60px] transition-opacity duration-500">
                            {phrases[currentPhraseIndex]}
                        </p>
                        <a href="#contato"
                            className="bg-yellow-500 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition inline-block"
                        >
                            Junte-se a nós
                        </a>
                    </div>

                    <img
                        src="/BT.png"
                        alt="Logo BT"
                        className="w-1/2 h-1/2 object-contain drop-shadow-2xl"
                    />
                </div>

            </div>
        </section>
    )
}