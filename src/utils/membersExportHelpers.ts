interface MembroExport {
  nome_guerra: string;
  nome_completo: string;
  numero_carteira: string;
  email: string | null;
  telefone: string | null;
  status_membro: string;
  ativo: boolean;
  is_admin: boolean;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  cargos?: string[];
}

/**
 * Exporta membros para CSV
 */
export function exportarMembrosParaCSV(membros: MembroExport[], nomeArquivo: string = 'integrantes') {
  // Cabeçalhos
  const headers = [
    'Nome de Guerra',
    'Nome Completo',
    'Carteira',
    'Email',
    'Telefone',
    'Status',
    'Ativo',
    'Admin',
    'Cidade',
    'Estado',
    'Cargos'
  ];

  // Dados
  const rows = membros.map(m => [
    m.nome_guerra,
    m.nome_completo,
    m.numero_carteira,
    m.email || '-',
    m.telefone || '-',
    m.status_membro,
    m.ativo ? 'Sim' : 'Não',
    m.is_admin ? 'Sim' : 'Não',
    m.endereco_cidade || '-',
    m.endereco_estado || '-',
    (m.cargos || []).join(', ') || '-'
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
 * Exporta membros para PDF (usando window.print com HTML formatado)
 */
export function exportarMembrosParaPDF(membros: MembroExport[], titulo: string = 'Relatório de Integrantes') {
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
            <p><strong>Total de integrantes:</strong> ${membros.length}</p>
            <p><strong>Ativos:</strong> ${membros.filter(m => m.ativo).length}</p>
            <p><strong>Inativos:</strong> ${membros.filter(m => !m.ativo).length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome de Guerra</th>
              <th>Nome Completo</th>
              <th>Carteira</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ativo</th>
              <th>Admin</th>
              <th>Localização</th>
              <th>Cargos</th>
            </tr>
          </thead>
          <tbody>
            ${membros.map(m => `
              <tr>
                <td>${m.nome_guerra}</td>
                <td>${m.nome_completo}</td>
                <td>${m.numero_carteira}</td>
                <td>${m.email || '-'}</td>
                <td>${m.telefone || '-'}</td>
                <td>${m.status_membro}</td>
                <td>${m.ativo ? 'Sim' : 'Não'}</td>
                <td>${m.is_admin ? 'Sim' : 'Não'}</td>
                <td>${m.endereco_cidade && m.endereco_estado ? `${m.endereco_cidade} - ${m.endereco_estado}` : '-'}</td>
                <td>${(m.cargos || []).join(', ') || '-'}</td>
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

