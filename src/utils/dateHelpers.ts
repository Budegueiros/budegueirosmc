/**
 * Gera lista de períodos (últimos 6 meses + mês atual)
 * Retorna array de objetos com { value: string, label: string }
 */
export function gerarPeriodos(): Array<{ value: string; label: string }> {
  const periodos: Array<{ value: string; label: string }> = [];
  const hoje = new Date();
  
  // Adicionar mês atual
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  periodos.push({
    value: mesAtual.toISOString().slice(0, 7) + '-01',
    label: mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  });

  // Adicionar últimos 6 meses
  for (let i = 1; i <= 6; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    periodos.push({
      value: data.toISOString().slice(0, 7) + '-01',
      label: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
  }

  return periodos;
}

/**
 * Verifica se uma data está no mês atual
 */
export function isMesAtual(data: string): boolean {
  const hoje = new Date();
  const dataComparacao = new Date(data);
  
  return hoje.getMonth() === dataComparacao.getMonth() &&
         hoje.getFullYear() === dataComparacao.getFullYear();
}

/**
 * Agrupa transações por data para exibição em seções
 */
export function groupTransactionsByDate<T extends { data: string; created_at?: string }>(
  transactions: T[]
): Array<{ title: string; date: string; data: T[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Map<string, { title: string; date: string; data: T[] }> = new Map();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.data + 'T00:00:00');
    date.setHours(0, 0, 0, 0);

    const dateKey = date.getTime().toString();
    const dateStr = date.toLocaleDateString('pt-BR');

    let label: string;
    if (date.getTime() === today.getTime()) {
      label = 'Hoje';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Ontem';
    } else {
      label = dateStr;
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        title: label,
        date: dateStr,
        data: [],
      });
    }

    groups.get(dateKey)!.data.push(transaction);
  });

  // Converter para array e ordenar por data (mais recente primeiro)
  return Array.from(groups.values()).sort((a, b) => {
    const dateA = new Date(a.data[0].data);
    const dateB = new Date(b.data[0].data);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Formata data relativa (Hoje, Ontem, ou data formatada)
 */
export function formatRelativeDate(dateString: string): { label: string; date: string } {
  const date = new Date(dateString + 'T00:00:00');
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toLocaleDateString('pt-BR');

  if (date.getTime() === today.getTime()) {
    return { label: 'Hoje', date: dateStr };
  } else if (date.getTime() === yesterday.getTime()) {
    return { label: 'Ontem', date: dateStr };
  } else {
    return { label: dateStr, date: dateStr };
  }
}
