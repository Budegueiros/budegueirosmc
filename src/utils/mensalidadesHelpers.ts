interface Mensalidade {
  id: string;
  valor: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
}

/**
 * Calcula o status de uma mensalidade baseado na data de vencimento e status atual
 */
export function calcularStatus(mensalidade: Mensalidade): string {
  // Normalizar status (trim e capitalizar primeira letra)
  const statusNormalizado = mensalidade.status?.trim() || '';
  const statusLower = statusNormalizado.toLowerCase();
  
  // Se já está pago ou isento, retornar o status padronizado
  if (statusLower === 'pago') {
    return 'Pago';
  }
  if (statusLower === 'isento') {
    return 'Isento';
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(mensalidade.data_vencimento);
  vencimento.setHours(0, 0, 0, 0);

  // Se venceu e não está pago, está atrasado
  if (vencimento < hoje && statusLower !== 'pago') {
    return 'Atrasado';
  }

  // Retornar status padronizado ou 'Aberto' como padrão
  if (statusLower === 'pendente') {
    return 'Pendente';
  }
  if (statusLower === 'atrasado') {
    return 'Atrasado';
  }
  if (statusLower === 'cancelado') {
    return 'Cancelado';
  }

  return statusNormalizado || 'Aberto';
}

/**
 * Calcula dias de atraso de uma mensalidade
 */
export function calcularDiasAtraso(mensalidade: Mensalidade): number {
  if (mensalidade.status === 'Pago' || mensalidade.status === 'Isento') {
    return 0;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(mensalidade.data_vencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diffTime = hoje.getTime() - vencimento.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Formata valor monetário para R$ XX,XX
 */
export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Formata data para DD/MM/YYYY
 */
export function formatarData(data: string | null): string {
  if (!data) return '-';
  
  const date = new Date(data);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata mês de referência para "Janeiro/2026"
 */
export function formatarMesReferencia(mesReferencia: string): string {
  const date = new Date(mesReferencia + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });
}

