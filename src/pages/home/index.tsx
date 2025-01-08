import Header from "../../components/header";
import backimg from "../../img/estrada-black-line-yellow.jpg";
import BrasaoFundoPreto from "../../img/BT.png";

function home() {
  return (
    <div
      className="h-screen flex flex-col items-center"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85) 11%, rgba(255,255,255,0.3) 44%, rgba(0,0,0,0.86) 87%),url(${backimg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />
      <p className="p-8 text-white font-roboto-serif italic text-lg font-extralight text-center md:w-3/6 md:text-4xl md:pt-8">
        "Unidos pela estrada, guiados pela irmandade. Aqui, o respeito e o
        código biker são o motor que nos leva adiante."
      </p>
      <img
        className="h-3/6 md:h-4/6 md:w-auto p-4"
        src={BrasaoFundoPreto}
        alt="Brasao Fundo Preto"
      />
    </div>
  );
}

export default home;
