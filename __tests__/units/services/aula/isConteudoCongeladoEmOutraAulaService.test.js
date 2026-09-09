import { jest } from '@jest/globals';
import { IsConteudoCongeladoEmOutraAulaService } from '../../../../src/services/aula/isConteudoCongeladoEmOutraAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

describe('IsConteudoCongeladoEmOutraAulaService', () => {
  let selectOneSpy;

  beforeEach(() => {
    selectOneSpy = jest.spyOn(AulaRepository.prototype, 'selectOne');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const params = {
    idContrato: 'contrato-1',
    idConteudo: 'conteudo-1',
    idAulaIgnorada: 'aula-1'
  };

  it('monta o where restrito ao contrato, excluindo a própria aula', async () => {
    selectOneSpy.mockResolvedValue(null);

    await IsConteudoCongeladoEmOutraAulaService.handle(params);

    const { where } = selectOneSpy.mock.calls[0][0];
    expect(where.idContrato).toBe('contrato-1');
    expect(where.idConteudo).toBe('conteudo-1');
    expect(where.id).toEqual({ not: 'aula-1' });
  });

  it('considera congelada a aula concluída ou a de escolha manual', async () => {
    selectOneSpy.mockResolvedValue(null);

    await IsConteudoCongeladoEmOutraAulaService.handle(params);

    const { where } = selectOneSpy.mock.calls[0][0];
    expect(where.OR).toEqual([{ status: { in: ['CONCLUIDA'] } }, { conteudoManual: true }]);
  });

  it('devolve true quando encontra outra aula presa ao conteúdo', async () => {
    selectOneSpy.mockResolvedValue({ id: 'aula-9' });

    await expect(IsConteudoCongeladoEmOutraAulaService.handle(params)).resolves.toBe(true);
  });

  it('devolve false quando o conteúdo está livre', async () => {
    selectOneSpy.mockResolvedValue(null);

    await expect(IsConteudoCongeladoEmOutraAulaService.handle(params)).resolves.toBe(false);
  });
});
