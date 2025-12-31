import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Menu, X } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed w-full z-30 top-0 left-0 bg-gradient-to-r from-[#cc0000] via-black/80 to-transparent backdrop-blur-sm border-b border-brand-red/20">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-rebel font-bold text-2xl tracking-[0.2em] text-white drop-shadow">
            BUDEGUEIROS MC
          </span>
        </Link>

        {/* Navegação Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`${isActive('/') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Home</Link>
          <Link to="/sobre" className={`${isActive('/sobre') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Sobre</Link>
          <Link to="/agenda" className={`${isActive('/agenda') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Agenda</Link>
          <Link to="/eventos" className={`${isActive('/eventos') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Eventos</Link>
          <Link to="/contato" className={`${isActive('/contato') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>Contato</Link>
          <Link to="/dashboard" className={`${isActive('/dashboard') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase text-sm tracking-wide`}>
            Área do Membro
          </Link>
          {/* Sociais */}
          <div className="flex items-center gap-4 ml-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-brand-red transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/budegueirosmc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-brand-red transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-white hover:text-brand-red transition">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Menu Mobile */}
        <button
          className="md:hidden text-white hover:text-brand-red transition"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </nav>

      {/* Navegação Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-brand-red/20 px-4 py-6">
          <div className="flex flex-col gap-4">
            <Link to="/" className={`${isActive('/') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/sobre" className={`${isActive('/sobre') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Sobre</Link>
            <Link to="/agenda" className={`${isActive('/agenda') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Agenda</Link>
            <Link to="/eventos" className={`${isActive('/eventos') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Eventos</Link>
            <Link to="/contato" className={`${isActive('/contato') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Contato</Link>
            <Link to="/dashboard" className={`${isActive('/dashboard') ? 'text-brand-red' : 'text-white'} hover:text-brand-red transition font-oswald uppercase`} onClick={() => setIsMenuOpen(false)}>Área do Membro</Link>
            <div className="flex items-center gap-4 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-brand-red transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/budegueirosmc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-brand-red transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-white hover:text-brand-red transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;