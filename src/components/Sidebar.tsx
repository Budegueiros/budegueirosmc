import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Sidebar() {
    return (
        <div className="fixed left-0 top-0 h-screen w-16 md:w-20 bg-brand-red z-50 flex flex-col items-center justify-between py-8">
            {/* Texto Vertical "BUDEGUEIROS MC" */}
            <div className="flex-1 flex items-center justify-center">
                <span className="transform -rotate-90 origin-center text-white font-rebel font-bold text-xl md:text-2xl tracking-[0.3em] whitespace-nowrap">
                    BUDEGUEIROS MC
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
    );
}
