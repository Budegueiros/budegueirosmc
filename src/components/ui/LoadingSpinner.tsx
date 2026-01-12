/**
 * Componente de loading reutilizável
 * Usado no Suspense para lazy loading de rotas
 */
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Carregando...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className={`${sizeClasses[size]} text-brand-red animate-spin mb-4`} />
      {message && (
        <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">{message}</p>
      )}
    </div>
  );
}
