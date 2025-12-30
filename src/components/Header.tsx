import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed w-full bg-brand-dark/95 backdrop-blur-sm z-30 border-b border-brand-red/20 pl-16 md:pl-20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Menu Hamburguer */}
          <button
            className="md:hidden text-brand-red hover:text-red-500 transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>

          {/* Menu Desktop */}
          <div className="hidden md:flex gap-8">
            <Link to="/" className={`${isActive('/') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Home</Link>
            <Link to="/sobre" className={`${isActive('/sobre') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Sobre</Link>
            <Link to="/agenda" className={`${isActive('/agenda') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Agenda</Link>
            <Link to="/eventos" className={`${isActive('/eventos') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Eventos</Link>
            <Link to="/contato" className={`${isActive('/contato') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Contato</Link>
            <Link to="/dashboard" className={`${isActive('/dashboard') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Área do Membro</Link>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 bg-brand-gray rounded-lg mt-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className={`${isActive('/') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 border-b border-brand-red/10 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/sobre"
                className={`${isActive('/sobre') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 border-b border-brand-red/10 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                to="/agenda"
                className={`${isActive('/agenda') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 border-b border-brand-red/10 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Agenda
              </Link>
              <Link
                to="/eventos"
                className={`${isActive('/eventos') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 border-b border-brand-red/10 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Eventos
              </Link>
              <Link
                to="/contato"
                className={`${isActive('/contato') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 border-b border-brand-red/10 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              <Link
                to="/dashboard"
                className={`${isActive('/dashboard') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition text-center py-3 font-oswald uppercase`}
                onClick={() => setIsMenuOpen(false)}
              >
                Área do Membro
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header; 