interface EventStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}> = {
  Ativo: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    dot: 'bg-green-500',
    label: 'Ativo'
  },
  Finalizado: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    label: 'Finalizado'
  },
  Cancelado: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
    label: 'Cancelado'
  }
};

export default function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Cancelado;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className="text-xs font-medium">{config.label}</span>
    </span>
  );
}

