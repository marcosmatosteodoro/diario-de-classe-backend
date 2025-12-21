import { jest } from '@jest/globals';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

describe('GetAulaListService', () => {
  let selectManySpy;
  let repoInstance;

  beforeEach(() => {
    repoInstance = new AulaRepository();
    selectManySpy = jest.spyOn(AulaRepository.prototype, 'selectMany');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar lista de aulas ordenada por dataAula', async () => {
    const aulasMock = [
      { id: 1, dataAula: '2023-01-01' },
      { id: 2, dataAula: '2023-01-02' }
    ];
    selectManySpy.mockResolvedValue(aulasMock);

    const result = await GetAulaListService.handle({ ativo: true });
    expect(selectManySpy).toHaveBeenCalledWith({
      select: repoInstance.getSelectFieldsWithRelations(),
      where: { ativo: true },
      orderBy: { dataAula: 'asc' }
    });
    expect(result).toBe(aulasMock);
  });

  it('deve passar selectFieldsWithRelations se withRelations=true', async () => {
    selectManySpy.mockResolvedValue([]);
    await GetAulaListService.handle({}, { withRelations: true });
    expect(selectManySpy).toHaveBeenCalledWith(
      expect.objectContaining({ select: repoInstance.getSelectFieldsWithRelations() })
    );
  });

  it('deve passar selectFields padrão se withRelations não for passado', async () => {
    const service = new GetAulaListService(AulaRepository, {}, {});
    expect(service.select).toEqual(service.repository.selectFields);
  });

  it('deve instanciar corretamente', () => {
    const service = new GetAulaListService(AulaRepository, { ativo: true }, {});
    expect(service).toBeInstanceOf(GetAulaListService);
    expect(service.where).toEqual({ ativo: true });
    expect(service.repository).toBeInstanceOf(AulaRepository);
  });
});
