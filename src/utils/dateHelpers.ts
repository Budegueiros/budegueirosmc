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

