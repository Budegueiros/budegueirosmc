import { useState } from 'react';
import { Menu, X } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed w-full bg-black/90 backdrop-blur-sm z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-rebel uppercase">Budegueiros MC</span>

          {/* Menu Hamburguer */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Menu Desktop */}
          <div className="hidden md:flex gap-6">
            <a href="#home" className="hover:text-yellow-500 transition">Home</a>
            <a href="#sobre" className="hover:text-yellow-500 transition">Sobre</a>
            <a href="#agenda" className="hover:text-yellow-500 transition">Agenda</a>
            <a href="#eventos" className="hover:text-yellow-500 transition">Eventos</a>
            <a href="#contato" className="hover:text-yellow-500 transition">Contato</a>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <div className="flex flex-col gap-4">
              <a
                href="#home"
                className="hover:text-yellow-500 transition text-center py-2 border-b border-zinc-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#sobre"
                className="hover:text-yellow-500 transition text-center py-2 border-b border-zinc-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </a>
              <a
                href="#agenda"
                className="hover:text-yellow-500 transition text-center py-2 border-b border-zinc-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Agenda
              </a>
              <a
                href="#eventos"
                className="hover:text-yellow-500 transition text-center py-2 border-b border-zinc-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Eventos
              </a>
              <a
                href="#contato"
                className="hover:text-yellow-500 transition text-center py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header; 