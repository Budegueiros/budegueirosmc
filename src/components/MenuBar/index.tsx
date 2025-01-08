import { Instagram } from "lucide-react";

function ManuBar() {
    return (  
        <div className="hidden text-white md:flex space-x-4 font-sans text-xl">
            <a
              rel="me nofollow noopener noreferrer"
              href="https://www.instagram.com/budegueirosmc/"
              className="text-[#c4170c] justify-center hover:text-blue-500"
            >
              <Instagram size={28} />
            </a>
            <a href="/" className="hover:text-gray-300">
              Home
            </a>
            <a href="/eventos" className="hover:text-gray-300">
              Eventos
            </a>
            <a href="/galeria" className="hover:text-gray-300">
              Galeria
            </a>
            <a href="/contato" className="hover:text-gray-300">
              Contato
            </a>
          </div>
    );
}

export default ManuBar;