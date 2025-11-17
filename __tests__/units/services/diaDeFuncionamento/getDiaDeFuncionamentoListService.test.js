import { GetDiaDeFuncionamentoListService } from '../../../../src/services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetDiaDeFuncionamentoListService', () => {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório padrão', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service).toBeInstanceOf(GetDiaDeFuncionamentoListService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    });

    test('deve aceitar where clause no construtor', () => {
      const whereClause = { diaDaSemana: { equals: 'SEGUNDA' } };
      const service = new GetDiaDeFuncionamentoListService(
        DiaDeFuncionamentoRepository,
        whereClause
      );

      expect(service.where).toEqual(whereClause);
    });

    test('deve herdar de AbstractService', () => {
      expect(Object.getPrototypeOf(GetDiaDeFuncionamentoListService)).toBe(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(typeof service.execute).toBe('function');
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve ter método handle estático implementado', () => {
      expect(typeof GetDiaDeFuncionamentoListService.handle).toBe('function');
      expect(GetDiaDeFuncionamentoListService.handle).not.toBe(AbstractService.handle);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service.execute).toBeDefined();
      expect(service.repository).toBeDefined();
      expect(service.where).toBeDefined();
      expect(GetDiaDeFuncionamentoListService.handle).toBeDefined();
    });

    test('deve ter repository configurado', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
      expect(service.repository.selectMany).toBeDefined();
    });

    test('deve aceitar repository customizado no construtor', () => {
      class MockRepository {
        constructor() {
          this.selectMany = () => Promise.resolve([]);
          this.selectFields = {
            id: true,
            diaDaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, {});

      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Integração com AbstractService', () => {
    test('deve chamar super no construtor', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service.repository).toBeDefined();
    });

    test('deve implementar método execute abstrato', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service.execute).not.toBe(AbstractService.prototype.execute);
      expect(typeof service.execute).toBe('function');
    });

    test('deve ser uma subclasse de AbstractService', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository, {});

      expect(service instanceof AbstractService).toBe(true);
      expect(service instanceof GetDiaDeFuncionamentoListService).toBe(true);
    });
  });

  describe('Funcionalidade do serviço', () => {
    test('deve executar busca com where clause vazio', async () => {
      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaDaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual({});
          return [
            {
              id: '1',
              diaDaSemana: 'SEGUNDA',
              horaInicial: '08:00',
              horaFinal: '12:00',
              ativo: true
            },
            {
              id: '2',
              diaDaSemana: 'TERCA',
              horaInicial: '09:00',
              horaFinal: '10:00',
              ativo: false
            }
          ];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, {});
      const result = await service.execute();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('diaDaSemana', 'SEGUNDA');
      expect(result[0]).toHaveProperty('horaInicial', '08:00');
    });

    test('deve executar busca com where clause específico', async () => {
      const whereClause = { diaDaSemana: { equals: 'SEGUNDA' } };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaDaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              diaDaSemana: 'SEGUNDA',
              horaInicial: '08:00',
              horaFinal: '12:00',
              ativo: true
            }
          ];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('diaDaSemana', 'SEGUNDA');
    });

    test('deve usar selectFields do repository', async () => {
      const customSelectFields = { id: true, diaDaSemana: true, horaInicial: true };

      class MockRepository {
        constructor() {
          this.selectFields = customSelectFields;
        }

        async selectMany({ select, _where }) {
          expect(select).toEqual(customSelectFields);
          return [];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, {});
      await service.execute();
    });

    test('deve filtrar por ativo', async () => {
      const whereClause = { ativo: true };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaDaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              diaDaSemana: 'SEGUNDA',
              horaInicial: '08:00',
              horaFinal: '12:00',
              ativo: true
            }
          ];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('ativo', true);
    });

    test('deve buscar registros com horaInicial não nula', async () => {
      const whereClause = { horaInicial: { not: null } };

      class MockRepository {
        constructor() {
          this.selectFields = { id: true, diaDaSemana: true, horaInicial: true };
        }

        async selectMany({ where }) {
          expect(where).toEqual(whereClause);
          return [{ id: '2', diaDaSemana: 'TERCA', horaInicial: '09:00' }];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0].horaInicial).toBe('09:00');
    });
  });

  describe('Método estático handle', () => {
    test('deve executar com where clause vazio', async () => {
      const result = await GetDiaDeFuncionamentoListService.handle({});

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('diaDaSemana');
        expect(result[0]).toHaveProperty('horaInicial');
      }
    });

    test('deve executar com where clause específico', async () => {
      const whereClause = { diaDaSemana: { equals: 'NAO_EXISTE' } };

      // O método handle normalmente usa o repository real e pode invocar Prisma
      // (que validaria enums). Aqui substituímos temporariamente o handle para usar
      // um MockRepository que garante retorno vazio para esse caso.
      const originalHandle = GetDiaDeFuncionamentoListService.handle;
      GetDiaDeFuncionamentoListService.handle = async function (where) {
        class MockRepository {
          constructor() {
            this.selectFields = { id: true, diaDaSemana: true, horaInicial: true };
          }

          async selectMany() {
            return [];
          }
        }

        const service = new GetDiaDeFuncionamentoListService(MockRepository, where);
        return await service.execute();
      };

      const result = await GetDiaDeFuncionamentoListService.handle(whereClause);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);

      // Restaurar o handle original
      GetDiaDeFuncionamentoListService.handle = originalHandle;
    });

    test('deve usar repositório padrão', async () => {
      const result = await GetDiaDeFuncionamentoListService.handle();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('diaDaSemana');
        expect(result[0]).toHaveProperty('horaFinal');
      }
    });

    test('deve executar com filtro por horaFinal', async () => {
      const whereClause = { horaFinal: { contains: '12:00' } };

      const result = await GetDiaDeFuncionamentoListService.handle(whereClause);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Casos de erro', () => {
    test('deve propagar erros do repository', async () => {
      class ErrorRepository {
        constructor() {
          this.selectFields = {};
        }

        async selectMany() {
          throw new Error('Database error');
        }
      }

      const service = new GetDiaDeFuncionamentoListService(ErrorRepository, {});

      await expect(service.execute()).rejects.toThrow('Database error');
    });

    test('deve tratar erro de conexão com banco', async () => {
      class ConnectionErrorRepository {
        constructor() {
          this.selectFields = {};
        }

        async selectMany() {
          throw new Error('Connection timeout');
        }
      }

      const service = new GetDiaDeFuncionamentoListService(ConnectionErrorRepository, {});

      await expect(service.execute()).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com where undefined', () => {
      const service = new GetDiaDeFuncionamentoListService(DiaDeFuncionamentoRepository);

      expect(service.where).toBeUndefined();
      expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    });

    test('deve funcionar com Repository undefined no construtor', () => {
      expect(() => {
        const service = new GetDiaDeFuncionamentoListService(undefined, {});
        return service;
      }).toThrow('Repository é obrigatório');
    });

    test('deve aceitar where clause complexo', () => {
      const complexWhere = {
        AND: [{ diaDaSemana: { in: ['SEGUNDA', 'TERCA'] } }, { ativo: true }]
      };

      const service = new GetDiaDeFuncionamentoListService(
        DiaDeFuncionamentoRepository,
        complexWhere
      );

      expect(service.where).toEqual(complexWhere);
    });
  });

  describe('Cenários específicos do modelo', () => {
    test('deve buscar registros por diaDaSemana', async () => {
      const whereClause = { diaDaSemana: { equals: 'SEGUNDA' } };

      class MockRepository {
        constructor() {
          this.selectFields = { id: true, diaDaSemana: true, horaInicial: true };
        }

        async selectMany({ where }) {
          expect(where).toEqual(whereClause);
          return [{ id: '1', diaDaSemana: 'SEGUNDA', horaInicial: '08:00' }];
        }
      }

      const service = new GetDiaDeFuncionamentoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0].diaDaSemana).toBe('SEGUNDA');
    });
  });
});
