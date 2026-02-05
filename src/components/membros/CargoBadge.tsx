interface CargoBadgeProps {
  nome: string;
  tipo?: string;
}

const CARGO_COLORS: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  'Brasionado': {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    dot: 'bg-green-500'
  },
  'Prospect': {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500'
  },
  'Aspirante': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500'
  },
  'default': {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500'
  }
};

export default function CargoBadge({ nome, tipo }: CargoBadgeProps) {
  const config = CARGO_COLORS[nome] || CARGO_COLORS.default;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {nome}
    </span>
  );
}


