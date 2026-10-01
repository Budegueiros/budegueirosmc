import { describe, it, expect } from 'vitest';
import { gerarPeriodosMensais } from '../mensalidadesHelpers';

describe('gerarPeriodosMensais', () => {
  it('gera todos os meses do intervalo, inclusive', () => {
    const periodos = gerarPeriodosMensais('2026-01', '2026-03', 5);
    expect(periodos).toEqual([
      { mes_referencia: '2026-01-01', data_vencimento: '2026-01-05' },
      { mes_referencia: '2026-02-01', data_vencimento: '2026-02-05' },
      { mes_referencia: '2026-03-01', data_vencimento: '2026-03-05' }
    ]);
  });

  it('atravessa a virada do ano', () => {
    const periodos = gerarPeriodosMensais('2026-11', '2027-02', 10);
    expect(periodos.map(p => p.mes_referencia)).toEqual([
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
      '2027-02-01'
    ]);
  });

  it('limita o dia de vencimento ao último dia do mês', () => {
    const periodos = gerarPeriodosMensais('2026-02', '2026-02', 31);
    expect(periodos[0].data_vencimento).toBe('2026-02-28');
  });

  it('retorna vazio quando o mês final é anterior ao inicial', () => {
    expect(gerarPeriodosMensais('2026-05', '2026-04', 5)).toEqual([]);
  });
});
