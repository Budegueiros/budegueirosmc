export default function Sobre() {
    return (
        <section id="sobre" className="py-20 min-h-dvh bg-zinc-900">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold mb-6">Sobre o Clube</h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Fundado em 14 de abril de 2024 por Anderson, Igor, Luiz, Marconi, Michel e Weslei, o Budegueiros Moto Clube
                            nasceu da união de amigos que compartilham a paixão por motocicletas, boa companhia e o desejo de explorar as estradas.
                            Com o lema "andar de moto e brindar à vida", o grupo não é apenas um clube, mas uma irmandade que celebra a amizade, o respeito e o espírito de aventura.
                        </p>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Inspirado pelos valores de união e lealdade, o clube proporciona aos seus membros experiências marcantes, seja em viagens,
                            encontros ou ações sociais. A organização do Budegueiros MC se baseia na hierarquia e na disciplina, garantindo harmonia e
                            um convívio saudável entre seus integrantes, que compartilham do compromisso com segurança, camaradagem e diversão.
                        </p>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            O clube é também um espaço acolhedor, onde cada membro é tratado como parte de uma grande família unida pelo amor às motocicletas
                            e ao prazer da convivência. Seja em eventos, nas estradas ou no ponto de encontro tradicional no Budega do Chopp, o Budegueiros MC
                            mantém viva a essência da liberdade sobre duas rodas e o prazer de celebrar cada quilômetro percorrido.
                        </p>
                        <p className="text-yellow-500 text-lg font-semibold">
                            Se você compartilha dessas paixões, o Budegueiros MC está de portas abertas para recebê-lo nessa jornada repleta de aventuras, amizades e boas histórias.
                        </p>
                    </div>
                    <div className="flex justify-center items-center rounded-xl">
                        <img
                            src="/brasao.jpg"
                            alt="Brasão Budegueiros MC"
                            className="max-w-md w-full h-auto rounded-3xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}