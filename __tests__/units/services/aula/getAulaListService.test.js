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

  describe('Constructor', () => {
    it('deve instanciar corretamente com where e params', () => {
      const service = new GetAulaListService(AulaRepository, { ativo: true }, {});
      expect(service).toBeInstanceOf(GetAulaListService);
      expect(service.where).toEqual({ ativo: true });
      expect(service.repository).toBeInstanceOf(AulaRepository);
    });

    it('deve usar selectFieldsWithRelations como padrão quando nenhum params é passado', () => {
      const service = new GetAulaListService(AulaRepository, {}, {});
      expect(service.select).toEqual(repoInstance.getSelectFieldsWithRelations());
    });

    it('deve usar selectFieldsWithRelations quando withRelations=true', () => {
      const service = new GetAulaListService(AulaRepository, {}, { withRelations: true });
      expect(service.select).toEqual(repoInstance.getSelectFieldsWithRelations());
    });

    it('deve usar select customizado quando params.select é fornecido', () => {
      const customSelect = { id: true, nome: true };
      const service = new GetAulaListService(AulaRepository, {}, { select: customSelect });
      expect(service.select).toEqual(customSelect);
    });
  });

  describe('execute', () => {
    it('deve retornar lista de aulas ordenada por dataAula', async () => {
      const aulasMock = [
        { id: 1, dataAula: '2023-01-01' },
        { id: 2, dataAula: '2023-01-02' }
      ];
      selectManySpy.mockResolvedValue(aulasMock);

      const service = new GetAulaListService(AulaRepository, { ativo: true }, {});
      const result = await service.execute();

      expect(selectManySpy).toHaveBeenCalledWith({
        select: repoInstance.getSelectFieldsWithRelations(),
        where: { ativo: true },
        orderBy: { dataAula: 'asc' }
      });
      expect(result).toEqual(aulasMock);
    });

    it('deve retornar lista vazia quando não há aulas', async () => {
      selectManySpy.mockResolvedValue([]);

      const service = new GetAulaListService(AulaRepository, {}, {});
      const result = await service.execute();

      expect(result).toEqual([]);
    });

    it('deve passar o select customizado para selectMany', async () => {
      const customSelect = { id: true, nome: true };
      selectManySpy.mockResolvedValue([]);

      const service = new GetAulaListService(AulaRepository, {}, { select: customSelect });
      await service.execute();

      expect(selectManySpy).toHaveBeenCalledWith({
        select: customSelect,
        where: {},
        orderBy: { dataAula: 'asc' }
      });
    });
  });

  describe('handle - Static method', () => {
    it('deve criar instância e executar o serviço', async () => {
      const aulasMock = [{ id: 1, dataAula: '2023-01-01' }];
      selectManySpy.mockResolvedValue(aulasMock);

      const result = await GetAulaListService.handle({ ativo: true }, { withRelations: true });

      expect(result).toEqual(aulasMock);
      expect(selectManySpy).toHaveBeenCalled();
    });

    it('deve aceitar where e params vazios', async () => {
      selectManySpy.mockResolvedValue([]);

      const result = await GetAulaListService.handle();

      expect(result).toEqual([]);
      expect(selectManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { dataAula: 'asc' }
        })
      );
    });

    it('deve propagar erros do repository', async () => {
      const error = new Error('Database error');
      selectManySpy.mockRejectedValue(error);

      await expect(GetAulaListService.handle()).rejects.toThrow('Database error');
    });
  });
});
