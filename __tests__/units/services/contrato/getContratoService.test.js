import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetContratoService', () => {
  let service, mockRepository;
  const mockId = 'contrato-123';

  beforeEach(() => {
    // Mock do repository
    mockRepository = class MockRepository {
      constructor() {
        this.selectFields = {
          id: true,
          status: true,
          idioma: true
        };
        this.selectOneParams = null;
        this.mockData = null;
      }

      getSelectFieldsWithRelations() {
        return {
          id: true,
          status: true,
          idioma: true,
          aluno: true,
          aulas: true,
          diaAulas: true
        };
      }

      async selectOne(params) {
        this.selectOneParams = params;
        return this.mockData;
      }
    };

    service = new GetContratoService(mockRepository, mockId);
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com Repository e id', () => {
      expect(service).toBeInstanceOf(GetContratoService);
      expect(service.id).toBe(mockId);
    });

    test('deve herdar de AbstractService', () => {
      expect(service).toBeInstanceOf(AbstractService);
    });

    test('deve inicializar select sem relações quando params não é fornecido', () => {
      expect(service.select).toEqual({
        id: true,
        status: true,
        idioma: true
      });
    });

    test('deve inicializar select com relações quando withRelations é true', () => {
      const serviceWithRelations = new GetContratoService(mockRepository, mockId, {
        withRelations: true
      });

      expect(serviceWithRelations.select).toEqual({
        id: true,
        status: true,
        idioma: true,
        aluno: true,
        aulas: true,
        diaAulas: true
      });
    });

    test('deve inicializar where com id do contrato', () => {
      expect(service.where).toEqual({ id: mockId });
    });

    test('deve mesclar additionalWhere quando fornecido', () => {
      const additionalWhere = { status: 'ATIVO' };
      const serviceWithWhere = new GetContratoService(mockRepository, mockId, {
        additionalWhere
      });

      expect(serviceWithWhere.where).toEqual({
        id: mockId,
        status: 'ATIVO'
      });
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter método execute implementado', () => {
      expect(service.execute).toBeDefined();
      expect(typeof service.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetContratoService.handle).toBeDefined();
      expect(typeof GetContratoService.handle).toBe('function');
    });

    test('execute deve ser uma função assíncrona', () => {
      expect(service.execute.constructor.name).toBe('AsyncFunction');
    });

    test('handle deve ser uma função assíncrona', () => {
      expect(GetContratoService.handle.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('execute()', () => {
    test('deve chamar repository.selectOne com parâmetros corretos', async () => {
      service.repository = new mockRepository();
      service.repository.mockData = {
        id: mockId,
        status: 'ATIVO'
      };

      await service.execute();

      expect(service.repository.selectOneParams).toEqual({
        where: { id: mockId },
        select: service.select,
        order: {
          aulas: {
            dataAula: 'asc',
            horaInicial: 'asc'
          }
        }
      });
    });

    test('deve retornar o contrato quando não há aulas', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        idioma: 'INGLES'
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result).toEqual(mockContrato);
    });

    test('deve retornar o contrato quando aulas é null', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: null
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result).toEqual(mockContrato);
    });

    test('deve retornar o contrato quando aulas é array vazio', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: []
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result).toEqual(mockContrato);
      expect(result.aulas).toEqual([]);
    });

    test('deve ordenar aulas por dataAula (crescente)', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: [
          {
            id: '3',
            dataAula: '2026-05-19T00:00:00.000Z',
            horaInicial: '12:00',
            horaFinal: '13:00'
          },
          {
            id: '1',
            dataAula: '2026-03-24T00:00:00.000Z',
            horaInicial: '12:00',
            horaFinal: '13:00'
          },
          {
            id: '2',
            dataAula: '2026-04-14T00:00:00.000Z',
            horaInicial: '12:00',
            horaFinal: '13:00'
          }
        ]
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result.aulas[0].id).toBe('1'); // 2026-03-24
      expect(result.aulas[1].id).toBe('2'); // 2026-04-14
      expect(result.aulas[2].id).toBe('3'); // 2026-05-19
    });

    test('deve ordenar aulas pela horaInicial quando dataAula é igual', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: [
          {
            id: '2',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '14:00',
            horaFinal: '15:00'
          },
          {
            id: '1',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '10:00',
            horaFinal: '11:20'
          },
          {
            id: '3',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '18:00',
            horaFinal: '19:00'
          }
        ]
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result.aulas[0].id).toBe('1'); // 10:00
      expect(result.aulas[1].id).toBe('2'); // 14:00
      expect(result.aulas[2].id).toBe('3'); // 18:00
    });

    test('deve ordenar aulas por dataAula e depois por horaInicial', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: [
          {
            id: '5',
            dataAula: '2026-04-02T00:00:00.000Z',
            horaInicial: '10:00',
            horaFinal: '11:20'
          },
          {
            id: '2',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '12:00',
            horaFinal: '13:00'
          },
          {
            id: '3',
            dataAula: '2026-03-31T00:00:00.000Z',
            horaInicial: '12:00',
            horaFinal: '13:00'
          },
          {
            id: '1',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '10:00',
            horaFinal: '11:20'
          },
          {
            id: '4',
            dataAula: '2026-04-02T00:00:00.000Z',
            horaInicial: '08:00',
            horaFinal: '09:00'
          }
        ]
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      // Esperado:
      // 1. id:1 (2026-03-26 10:00)
      // 2. id:2 (2026-03-26 12:00)
      // 3. id:3 (2026-03-31 12:00)
      // 4. id:4 (2026-04-02 08:00)
      // 5. id:5 (2026-04-02 10:00)
      expect(result.aulas[0].id).toBe('1');
      expect(result.aulas[1].id).toBe('2');
      expect(result.aulas[2].id).toBe('3');
      expect(result.aulas[3].id).toBe('4');
      expect(result.aulas[4].id).toBe('5');
    });

    test('deve lidar com horários com minutos diferentes', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: [
          {
            id: '3',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '10:30',
            horaFinal: '11:30'
          },
          {
            id: '1',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '10:00',
            horaFinal: '11:00'
          },
          {
            id: '2',
            dataAula: '2026-03-26T00:00:00.000Z',
            horaInicial: '10:15',
            horaFinal: '11:15'
          }
        ]
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result.aulas[0].id).toBe('1'); // 10:00
      expect(result.aulas[1].id).toBe('2'); // 10:15
      expect(result.aulas[2].id).toBe('3'); // 10:30
    });

    test('não deve modificar as aulas quando aulas não é um array', async () => {
      const mockContrato = {
        id: mockId,
        status: 'ATIVO',
        aulas: 'not-an-array'
      };

      service.repository = new mockRepository();
      service.repository.mockData = mockContrato;

      const result = await service.execute();

      expect(result.aulas).toBe('not-an-array');
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetContratoService.handle).toBe('function');
    });

    test('deve ser uma função assíncrona', () => {
      expect(GetContratoService.handle.constructor.name).toBe('AsyncFunction');
    });
  });
});
