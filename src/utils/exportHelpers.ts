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

interface Evento {
  id: string;
  nome: string;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  cidade: string;
  estado: string;
  status: string;
  distancia_km: number | null;
}

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: string;
  tipo_destinatario: string;
  valor_destinatario: string | null;
  created_at: string;
  total_destinatarios: number;
  total_lidos: number;
  percentual_leitura: number;
}

interface Documento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  tipo_destinatario: string;
  valor_destinatario: string | null;
  created_at: string;
  total_destinatarios: number;
  total_acessos: number;
  percentual_acesso: number;
}

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
  total_votos: number;
}

/**
 * Exporta eventos para CSV
 */
export function exportarEventosParaCSV(eventos: Evento[], nomeArquivo: string = 'eventos') {
  // Cabeçalhos
  const headers = [
    'Nome do Evento',
    'Tipo',
    'Data',
    'Hora Saída',
    'Local de Saída',
    'Cidade',
    'Estado',
    'Distância (KM)',
    'Status'
  ];

  // Dados
  const rows = eventos.map(e => [
    e.nome,
    e.tipo_evento,
    new Date(e.data_evento + 'T00:00:00').toLocaleDateString('pt-BR'),
    e.hora_saida || '-',
    e.local_saida,
    e.cidade,
    e.estado,
    e.distancia_km?.toString() || '-',
    e.status
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
 * Exporta eventos para PDF (usando window.print com HTML formatado)
 */
export function exportarEventosParaPDF(eventos: Evento[], titulo: string = 'Relatório de Eventos') {
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
            <p><strong>Total de registros:</strong> ${eventos.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome do Evento</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Hora Saída</th>
              <th>Local de Saída</th>
              <th>Cidade</th>
              <th>Estado</th>
              <th>Distância (KM)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${eventos.map(e => `
              <tr>
                <td>${e.nome}</td>
                <td>${e.tipo_evento}</td>
                <td>${new Date(e.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td>${e.hora_saida || '-'}</td>
                <td>${e.local_saida}</td>
                <td>${e.cidade}</td>
                <td>${e.estado}</td>
                <td>${e.distancia_km || '-'}</td>
                <td>${e.status}</td>
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


/**
 * Exporta comunicados para CSV
 */
export function exportarComunicadosParaCSV(comunicados: Comunicado[], nomeArquivo: string = 'comunicados') {
  const headers = [
    'Título',
    'Prioridade',
    'Tipo Destinatário',
    'Valor Destinatário',
    'Data de Envio',
    'Total Destinatários',
    'Total Lidos',
    '% de Leitura'
  ];

  const rows = comunicados.map(c => [
    c.titulo,
    c.prioridade,
    c.tipo_destinatario,
    c.valor_destinatario || '-',
    new Date(c.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    c.total_destinatarios.toString(),
    c.total_lidos.toString(),
    `${c.percentual_leitura}%`
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

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
 * Exporta comunicados para PDF
 */
export function exportarComunicadosParaPDF(comunicados: Comunicado[], titulo: string = 'Relatório de Comunicados') {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <style>
          @media print { @page { margin: 1cm; } }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { margin-bottom: 20px; }
          .info { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="info">
            <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${comunicados.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Prioridade</th>
              <th>Tipo Destinatário</th>
              <th>Data de Envio</th>
              <th>Total Lidos</th>
              <th>% de Leitura</th>
            </tr>
          </thead>
          <tbody>
            ${comunicados.map(c => `
              <tr>
                <td>${c.titulo}</td>
                <td>${c.prioridade}</td>
                <td>${c.tipo_destinatario}</td>
                <td>${new Date(c.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
                <td>${c.total_lidos}/${c.total_destinatarios}</td>
                <td>${c.percentual_leitura}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

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

/**
 * Exporta documentos para CSV
 */
export function exportarDocumentosParaCSV(documentos: Documento[], nomeArquivo: string = 'documentos') {
  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const headers = [
    'Título',
    'Tipo Arquivo',
    'Tamanho',
    'Tipo Destinatário',
    'Valor Destinatário',
    'Data',
    'Total Acessos',
    '% de Acesso'
  ];

  const rows = documentos.map(d => [
    d.titulo,
    d.tipo_arquivo || '-',
    formatarTamanho(d.tamanho_bytes),
    d.tipo_destinatario,
    d.valor_destinatario || '-',
    new Date(d.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    d.total_acessos.toString(),
    `${d.percentual_acesso}%`
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

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
 * Exporta documentos para PDF
 */
export function exportarDocumentosParaPDF(documentos: Documento[], titulo: string = 'Relatório de Documentos') {
  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <style>
          @media print { @page { margin: 1cm; } }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { margin-bottom: 20px; }
          .info { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="info">
            <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${documentos.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Data</th>
              <th>Total Acessos</th>
              <th>% de Acesso</th>
            </tr>
          </thead>
          <tbody>
            ${documentos.map(d => `
              <tr>
                <td>${d.titulo}</td>
                <td>${d.tipo_arquivo || '-'}</td>
                <td>${formatarTamanho(d.tamanho_bytes)}</td>
                <td>${new Date(d.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
                <td>${d.total_acessos}/${d.total_destinatarios}</td>
                <td>${d.percentual_acesso}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

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

/**
 * Exporta enquetes para CSV
 */
export function exportarEnquetesParaCSV(enquetes: Enquete[], nomeArquivo: string = 'enquetes') {
  const headers = [
    'Título',
    'Tipo',
    'Status',
    'Data de Encerramento',
    'Data de Criação',
    'Total de Votos'
  ];

  const rows = enquetes.map(e => [
    e.titulo,
    e.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Texto Livre',
    e.status === 'aberta' ? 'Ativa' : 'Finalizada',
    new Date(e.data_encerramento).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    new Date(e.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    e.total_votos.toString()
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

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
 * Exporta enquetes para PDF
 */
export function exportarEnquetesParaPDF(enquetes: Enquete[], titulo: string = 'Relatório de Enquetes') {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <style>
          @media print { @page { margin: 1cm; } }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { margin-bottom: 20px; }
          .info { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="info">
            <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${enquetes.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Data de Encerramento</th>
              <th>Total de Votos</th>
            </tr>
          </thead>
          <tbody>
            ${enquetes.map(e => `
              <tr>
                <td>${e.titulo}</td>
                <td>${e.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Texto Livre'}</td>
                <td>${e.status === 'aberta' ? 'Ativa' : 'Finalizada'}</td>
                <td>${new Date(e.data_encerramento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
                <td>${e.total_votos}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

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
