import { jest } from '@jest/globals';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';
import ContratoRepository from '../../../../src/repositories/contratoRepository.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';

describe('UpdateAulasContratoService', () => {
  let updateSpy;
  let getAulaListHandleSpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new ContratoRepository();
    updateSpy = jest.spyOn(ContratoRepository.prototype, 'update');
    getAulaListHandleSpy = jest.spyOn(GetAulaListService, 'handle');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve atualizar contrato com totais corretos quando há aulas de diversos tipos', async () => {
    const contratoId = 1;
    const aulasMock = [
      { id: 1, status: 'CONCLUIDA', tipo: 'REGULAR' },
      { id: 2, status: 'CONCLUIDA', tipo: 'REGULAR' },
      { id: 3, status: 'AGENDADA', tipo: 'REGULAR' },
      { id: 4, status: 'CANCELADA_POR_FALTA', tipo: 'REGULAR' },
      { id: 5, status: 'CANCELADA', tipo: 'REGULAR' },
      { id: 6, status: 'CONCLUIDA', tipo: 'REPOSICAO' },
      { id: 7, status: 'AGENDADA', tipo: 'REPOSICAO' }
    ];

    const expectedData = {
      totalAulas: 7,
      totalAulasFeitas: 3,
      totalReposicoes: 2,
      totalFaltas: 1,
      totalAulasCanceladas: 1
    };

    const expectedResult = {
      id: contratoId,
      ...expectedData
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue(expectedResult);

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(getAulaListHandleSpy).toHaveBeenCalledWith({ idContrato: contratoId });
    expect(updateSpy).toHaveBeenCalledWith({ id: contratoId }, expectedData, {
      select: repoInstance.selectFields
    });
    expect(result).toEqual(expectedResult);
  });

  it('deve retornar totais zerados quando não há aulas', async () => {
    const contratoId = 2;
    const aulasMock = [];

    const expectedData = {
      totalAulas: 0,
      totalAulasFeitas: 0,
      totalReposicoes: 0,
      totalFaltas: 0,
      totalAulasCanceladas: 0
    };

    const expectedResult = {
      id: contratoId,
      ...expectedData
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue(expectedResult);

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(result).toEqual(expectedResult);
    expect(updateSpy).toHaveBeenCalledWith({ id: contratoId }, expectedData, {
      select: repoInstance.selectFields
    });
  });

  it('deve contar apenas aulas concluídas em totalAulasFeitas', async () => {
    const contratoId = 3;
    const aulasMock = [
      { id: 1, status: 'CONCLUIDA', tipo: 'REGULAR' },
      { id: 2, status: 'AGENDADA', tipo: 'REGULAR' },
      { id: 3, status: 'EM_ANDAMENTO', tipo: 'REGULAR' },
      { id: 4, status: 'CANCELADA', tipo: 'REGULAR' }
    ];

    const expectedData = {
      totalAulas: 4,
      totalAulasFeitas: 1,
      totalReposicoes: 0,
      totalFaltas: 0,
      totalAulasCanceladas: 1
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue({ id: contratoId, ...expectedData });

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(result.totalAulasFeitas).toBe(1);
  });

  it('deve contar corretamente apenas reposições em totalReposicoes', async () => {
    const contratoId = 4;
    const aulasMock = [
      { id: 1, status: 'CONCLUIDA', tipo: 'REPOSICAO' },
      { id: 2, status: 'AGENDADA', tipo: 'REPOSICAO' },
      { id: 3, status: 'CONCLUIDA', tipo: 'REGULAR' },
      { id: 4, status: 'CANCELADA', tipo: 'REPOSICAO' }
    ];

    const expectedData = {
      totalAulas: 4,
      totalAulasFeitas: 2,
      totalReposicoes: 3,
      totalFaltas: 0,
      totalAulasCanceladas: 1
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue({ id: contratoId, ...expectedData });

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(result.totalReposicoes).toBe(3);
  });

  it('deve contar apenas aulas CANCELADA_POR_FALTA em totalFaltas', async () => {
    const contratoId = 5;
    const aulasMock = [
      { id: 1, status: 'CANCELADA_POR_FALTA', tipo: 'REGULAR' },
      { id: 2, status: 'CANCELADA_POR_FALTA', tipo: 'REGULAR' },
      { id: 3, status: 'CANCELADA', tipo: 'REGULAR' },
      { id: 4, status: 'CONCLUIDA', tipo: 'REGULAR' }
    ];

    const expectedData = {
      totalAulas: 4,
      totalAulasFeitas: 1,
      totalReposicoes: 0,
      totalFaltas: 2,
      totalAulasCanceladas: 1
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue({ id: contratoId, ...expectedData });

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(result.totalFaltas).toBe(2);
  });

  it('deve contar apenas aulas CANCELADA em totalAulasCanceladas', async () => {
    const contratoId = 6;
    const aulasMock = [
      { id: 1, status: 'CANCELADA', tipo: 'REGULAR' },
      { id: 2, status: 'CANCELADA', tipo: 'REGULAR' },
      { id: 3, status: 'CANCELADA_POR_FALTA', tipo: 'REGULAR' },
      { id: 4, status: 'CONCLUIDA', tipo: 'REGULAR' }
    ];

    const expectedData = {
      totalAulas: 4,
      totalAulasFeitas: 1,
      totalReposicoes: 0,
      totalFaltas: 1,
      totalAulasCanceladas: 2
    };

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue({ id: contratoId, ...expectedData });

    const result = await UpdateAulasContratoService.handle(contratoId);

    expect(result.totalAulasCanceladas).toBe(2);
  });

  it('deve instanciar corretamente com repository e id', () => {
    const contratoId = 7;
    const service = new UpdateAulasContratoService(ContratoRepository, contratoId);

    expect(service).toBeInstanceOf(UpdateAulasContratoService);
    expect(service.id).toBe(contratoId);
    expect(service.repository).toBeInstanceOf(ContratoRepository);
  });

  it('deve usar o id fornecido no execute', async () => {
    const contratoId = 8;
    const aulasMock = [{ id: 1, status: 'CONCLUIDA', tipo: 'REGULAR' }];

    getAulaListHandleSpy.mockResolvedValue(aulasMock);
    updateSpy.mockResolvedValue({ id: contratoId, totalAulas: 1 });

    const service = new UpdateAulasContratoService(ContratoRepository, contratoId);
    await service.execute();

    expect(getAulaListHandleSpy).toHaveBeenCalledWith({ idContrato: contratoId });
    expect(updateSpy).toHaveBeenCalledWith(
      { id: contratoId },
      expect.any(Object),
      expect.any(Object)
    );
  });
});
