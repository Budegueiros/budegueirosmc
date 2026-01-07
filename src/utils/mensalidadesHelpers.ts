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
  
  // Criar data de vencimento no timezone local para evitar problemas de timezone
  const dateStr = mensalidade.data_vencimento.split('T')[0];
  const [ano, mes, dia] = dateStr.split('-').map(Number);
  const vencimento = new Date(ano, mes - 1, dia);
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
  
  // Criar data de vencimento no timezone local para evitar problemas de timezone
  const dateStr = mensalidade.data_vencimento.split('T')[0];
  const [ano, mes, dia] = dateStr.split('-').map(Number);
  const vencimento = new Date(ano, mes - 1, dia);
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
 * Corrige problema de timezone ao criar a data no timezone local
 */
export function formatarData(data: string | null): string {
  if (!data) return '-';
  
  // Se a data já está no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
  // Parsear manualmente para evitar problemas de timezone
  const dateStr = data.split('T')[0]; // Remove hora se houver
  const [ano, mes, dia] = dateStr.split('-').map(Number);
  
  if (!ano || !mes || !dia || isNaN(ano) || isNaN(mes) || isNaN(dia)) {
    return '-';
  }
  
  // Criar data no timezone local (não UTC)
  const date = new Date(ano, mes - 1, dia);
  
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

