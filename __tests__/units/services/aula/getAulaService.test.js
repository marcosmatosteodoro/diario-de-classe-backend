import { jest } from '@jest/globals';
import { GetAulaService } from '../../../../src/services/aula/getAulaService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

describe('GetAulaService', () => {
  let selectOneSpy;

  beforeEach(() => {
    selectOneSpy = jest.spyOn(AulaRepository.prototype, 'selectOne');
    selectOneSpy.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('busca apenas pelo id quando nenhum filtro extra é informado', async () => {
    await GetAulaService.handle('aula-1');

    expect(selectOneSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'aula-1' } }));
  });

  it('leva o filtro de autorização até o where, e não o descarta', async () => {
    // Regressão: o segundo argumento era aceito na chamada e ignorado no
    // construtor, então o { idProfessor } do AbstractAulaController nunca
    // chegava ao Prisma e qualquer professor alcançava aula de outro.
    await GetAulaService.handle('aula-1', { idProfessor: 'professor-1' });

    expect(selectOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'aula-1', idProfessor: 'professor-1' }
      })
    );
  });

  it('aceita filtro com múltiplas condições', async () => {
    await GetAulaService.handle('aula-1', {
      idProfessor: 'professor-1',
      idContrato: 'contrato-1'
    });

    expect(selectOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'aula-1',
          idProfessor: 'professor-1',
          idContrato: 'contrato-1'
        }
      })
    );
  });
});
