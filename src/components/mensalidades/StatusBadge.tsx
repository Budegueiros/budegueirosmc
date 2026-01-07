interface StatusBadgeProps {
  status: string;
  diasAtraso?: number;
}

const STATUS_CONFIG: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}> = {
  Pago: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    dot: 'bg-green-500',
    label: 'Pago'
  },
  Aberto: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500',
    label: 'Aberto'
  },
  Pendente: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500',
    label: 'Pendente'
  },
  Atrasado: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
    label: 'Atrasado'
  },
  Isento: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    label: 'Isento'
  },
  Cancelado: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    label: 'Cancelado'
  }
};

export default function StatusBadge({ status, diasAtraso }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Cancelado;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className="text-xs font-medium">{config.label}</span>
      {diasAtraso !== undefined && diasAtraso > 0 && (
        <span className="text-xs opacity-75">(+{diasAtraso} dias)</span>
      )}
    </span>
  );
}

