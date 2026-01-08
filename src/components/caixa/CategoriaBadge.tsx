import { CategoriaFluxoCaixa } from '../../types/database.types';

interface CategoriaBadgeProps {
  categoria: CategoriaFluxoCaixa;
}

const CATEGORIA_CONFIG: Record<CategoriaFluxoCaixa, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}> = {
  // Categorias de Entrada
  'Mensalidade': {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    dot: 'bg-green-500',
    label: 'Mensalidade'
  },
  'Doação': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    label: 'Doação'
  },
  'Venda': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-500',
    border: 'border-cyan-500/20',
    dot: 'bg-cyan-500',
    label: 'Venda'
  },
  'Evento': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/20',
    dot: 'bg-indigo-500',
    label: 'Evento'
  },
  // Categorias de Saída
  'Combustível': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
    label: 'Combustível'
  },
  'Sede': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    label: 'Sede'
  },
  'Eventos': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    label: 'Eventos'
  },
  'Outros': {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    label: 'Outros'
  }
};

export default function CategoriaBadge({ categoria }: CategoriaBadgeProps) {
  const config = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG['Outros'];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className="text-xs font-medium">{config.label}</span>
    </span>
  );
}

