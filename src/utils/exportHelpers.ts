import { formatarValor, formatarData, formatarMesReferencia } from './mensalidadesHelpers';

interface Mensalidade {
  id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

/**
 * Exporta mensalidades para CSV
 */
export function exportarParaCSV(mensalidades: Mensalidade[], nomeArquivo: string = 'mensalidades') {
  // Cabeçalhos
  const headers = [
    'Nome de Guerra',
    'Nome Completo',
    'Carteira',
    'Mês Referência',
    'Valor',
    'Data Vencimento',
    'Data Pagamento',
    'Status',
    'Forma Pagamento'
  ];

  // Dados
  const rows = mensalidades.map(m => [
    m.membros.nome_guerra,
    m.membros.nome_completo,
    m.membros.numero_carteira,
    formatarMesReferencia(m.mes_referencia),
    m.valor.toFixed(2).replace('.', ','),
    formatarData(m.data_vencimento),
    formatarData(m.data_pagamento),
    m.status,
    m.forma_pagamento || '-'
  ]);

  // Combinar cabeçalhos e dados
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // Adicionar BOM para Excel reconhecer UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta mensalidades para PDF (usando window.print com HTML formatado)
 */
export function exportarParaPDF(mensalidades: Mensalidade[], titulo: string = 'Relatório de Mensalidades') {
  // Criar HTML para impressão
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .header {
            margin-bottom: 20px;
          }
          .info {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="info">
            <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${mensalidades.length}</p>
            <p><strong>Total arrecadado:</strong> R$ ${mensalidades
              .filter(m => m.status === 'Pago')
              .reduce((acc, m) => acc + m.valor, 0)
              .toFixed(2)
              .replace('.', ',')}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome de Guerra</th>
              <th>Nome Completo</th>
              <th>Carteira</th>
              <th>Mês Referência</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th>Forma Pagamento</th>
            </tr>
          </thead>
          <tbody>
            ${mensalidades.map(m => `
              <tr>
                <td>${m.membros.nome_guerra}</td>
                <td>${m.membros.nome_completo}</td>
                <td>${m.membros.numero_carteira}</td>
                <td>${formatarMesReferencia(m.mes_referencia)}</td>
                <td>R$ ${m.valor.toFixed(2).replace('.', ',')}</td>
                <td>${formatarData(m.data_vencimento)}</td>
                <td>${formatarData(m.data_pagamento)}</td>
                <td>${m.status}</td>
                <td>${m.forma_pagamento || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Criar nova janela para impressão
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

