import { GenerateAulasByContratoController } from '../../../../src/controllers/aula/generateAulasByContratoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GenerateAulasByContratoController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: 'contrato-123' },
      body: {
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        diasAulas: [
          { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
          { diaSemana: 'QUARTA', horaInicial: '14:00', horaFinal: '16:00' }
        ]
      },
      t: key => {
        const translations = {
          'aulas.generate.no_classes': 'Nenhuma aula gerada para o período informado',
          'aulas.generate.error': 'Erro ao gerar aulas'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      statusCode: null,
      data: null
    };

    controller = new GenerateAulasByContratoController(mockReq, mockRes);
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(GenerateAulasByContratoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where como objeto vazio', () => {
      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });

    test('deve ter acesso ao req e res', () => {
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter método execute implementado', () => {
      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GenerateAulasByContratoController.handle).toBeDefined();
      expect(typeof GenerateAulasByContratoController.handle).toBe('function');
    });

    test('deve ter método generateDateRangeByWeekDay', () => {
      expect(typeof controller.generateDateRangeByWeekDay).toBe('function');
    });

    test('deve ter método aulaPrepare', () => {
      expect(typeof controller.aulaPrepare).toBe('function');
    });

    test('deve implementar os métodos obrigatórios', () => {
      expect(typeof controller.execute).toBe('function');
      expect(typeof GenerateAulasByContratoController.handle).toBe('function');
    });

    test('deve chamar super no construtor', () => {
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('generateDateRangeByWeekDay', () => {
    test('deve gerar datas apenas para os dias da semana especificados', () => {
      const startDate = new Date('2025-01-06'); // Segunda-feira
      const endDate = new Date('2025-01-12'); // Domingo
      const diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '14:00', horaFinal: '16:00' }
      ];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(2); // 1 segunda + 1 quarta
      expect(result[0].dataAula.getUTCDay()).toBe(1); // Segunda-feira
      expect(result[1].dataAula.getUTCDay()).toBe(3); // Quarta-feira
    });

    test('deve incluir horaInicial e horaFinal de cada dia', () => {
      const startDate = new Date(2025, 0, 13); // Segunda-feira (mês 0 = janeiro)
      const endDate = new Date(2025, 0, 13);
      const diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '09:00', horaFinal: '11:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(1);
      expect(result[0].horaInicial).toBe('09:00');
      expect(result[0].horaFinal).toBe('11:00');
    });

    test('deve retornar array vazio quando não há dias correspondentes', () => {
      const startDate = new Date('2025-01-06'); // Segunda-feira
      const endDate = new Date('2025-01-08'); // Quarta-feira
      const diasAulas = [{ diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(0);
    });

    test('deve processar múltiplas semanas corretamente', () => {
      const startDate = new Date('2025-01-01'); // Quarta-feira
      const endDate = new Date('2025-01-14'); // Terça-feira (2 semanas)
      const diasAulas = [{ diaSemana: 'QUARTA', horaInicial: '08:00', horaFinal: '10:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(2); // 2 quartas-feiras
    });

    test('deve processar todos os dias da semana', () => {
      const startDate = new Date('2025-01-06'); // Segunda-feira
      const endDate = new Date('2025-01-12'); // Domingo
      const diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUINTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SABADO', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '10:00' }
      ];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(7); // Todos os 7 dias
    });

    test('deve mapear corretamente DOMINGO como dia 0', () => {
      const startDate = new Date(2025, 0, 12); // Domingo
      const endDate = new Date(2025, 0, 12);
      const diasAulas = [{ diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '10:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(1);
      expect(result[0].dataAula.getUTCDay()).toBe(0);
    });

    test('deve mapear corretamente SABADO como dia 6', () => {
      const startDate = new Date(2025, 0, 11); // Sábado
      const endDate = new Date(2025, 0, 11);
      const diasAulas = [{ diaSemana: 'SABADO', horaInicial: '08:00', horaFinal: '10:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(1);
      expect(result[0].dataAula.getUTCDay()).toBe(6);
    });

    test('deve retornar objetos com dataAula, horaInicial e horaFinal', () => {
      const startDate = new Date(2025, 0, 13); // Segunda-feira
      const endDate = new Date(2025, 0, 13);
      const diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      const result = controller.generateDateRangeByWeekDay(startDate, endDate, diasAulas);

      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('dataAula');
      expect(result[0]).toHaveProperty('horaInicial');
      expect(result[0]).toHaveProperty('horaFinal');
      expect(result[0].dataAula).toBeInstanceOf(Date);
    });
  });

  describe('aulaPrepare', () => {
    const mockProfessor = {
      id: 'prof-123',
      nome: 'João',
      nomeCompleto: 'João Silva'
    };

    test('deve preparar dados da aula com tipo PADRAO', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 60
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result).toEqual({
        dataAula: input.dataAula,
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 60,
        tipo: 'PADRAO',
        idProfessor: controller.idProfessor,
        professor: {
          id: mockProfessor.id,
          nomeCompleto: mockProfessor.nomeCompleto,
          nome: mockProfessor.nome
        },
        observacao: null
      });
    });

    test('deve sempre definir tipo como PADRAO', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '14:00',
        horaFinal: '16:00',
        duracaoAula: 120
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.tipo).toBe('PADRAO');
    });

    test('deve sempre definir observacao como null', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 60
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.observacao).toBeNull();
    });

    test('deve preservar a data original', () => {
      const originalDate = new Date('2025-01-10');
      const input = {
        dataAula: originalDate,
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 60
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.dataAula).toBe(originalDate);
    });

    test('deve incluir horaInicial e horaFinal', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '09:30',
        horaFinal: '11:45',
        duracaoAula: 90
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.horaInicial).toBe('09:30');
      expect(result.horaFinal).toBe('11:45');
      expect(result.duracaoAula).toBe(90);
    });

    test('deve incluir duracaoAula', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 120
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.duracaoAula).toBe(120);
    });

    test('deve incluir informações do professor', () => {
      const input = {
        dataAula: new Date('2025-01-10'),
        horaInicial: '08:00',
        horaFinal: '10:00',
        duracaoAula: 60
      };

      const result = controller.aulaPrepare(input, mockProfessor);

      expect(result.professor).toEqual({
        id: mockProfessor.id,
        nomeCompleto: mockProfessor.nomeCompleto,
        nome: mockProfessor.nome
      });
      expect(result.idProfessor).toBe(controller.idProfessor);
    });
  });

  describe('execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve retornar 200 com array de aulas geradas', async () => {
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toHaveProperty('count');
      expect(mockRes.data).toHaveProperty('aulas');
      expect(Array.isArray(mockRes.data.aulas)).toBe(true);
    });

    test('deve processar dataInicio e dataFim do body', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBeGreaterThanOrEqual(1);
      expect(mockRes.data.aulas.length).toBeGreaterThanOrEqual(1);
    });

    test('deve retornar 422 quando não houver aulas geradas', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' }];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Nenhuma aula gerada para o período informado');
    });

    test('deve mapear dates para aulas usando aulaPrepare', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.aulas[0]).toHaveProperty('tipo', 'PADRAO');
      expect(mockRes.data.aulas[0]).toHaveProperty('observacao', null);
    });

    test('deve usar chave de tradução correta quando não há aulas', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Nenhuma aula gerada para o período informado';
      };

      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' }];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(translationKey).toBe('aulas.generate.no_classes');
    });

    test('deve chamar handleError quando ocorrer erro', async () => {
      mockReq.body.diasAulas = null; // Vai causar erro no map

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao gerar aulas');
    });

    test('deve usar chave de tradução correta para erros', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Erro ao gerar aulas';
      };

      mockReq.body.diasAulas = null;

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(translationKey).toBe('aulas.generate.error');
    });

    test('deve processar diasAulas do body corretamente', async () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SEXTA', horaInicial: '09:00', horaFinal: '11:00' }
      ];
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-10T03:00:00.000Z'; // Sexta

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBe(2);
      expect(mockRes.data.aulas.length).toBe(2); // Segunda, Sexta
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GenerateAulasByContratoController.handle).toBe('function');
      expect(GenerateAulasByContratoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(GenerateAulasByContratoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      await GenerateAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GenerateAulasByContratoController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2);
    });

    test('deve passar req e res para nova instância', async () => {
      await GenerateAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toHaveProperty('aulas');
      expect(Array.isArray(mockRes.data.aulas)).toBe(true);
    });

    test('deve executar o método execute da instância', async () => {
      await GenerateAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve tratar erros adequadamente no método estático', async () => {
      mockReq.body.diasAulas = null;

      await GenerateAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao gerar aulas');
    });
  });

  describe('Integração completa', () => {
    test('deve processar fluxo completo com sucesso', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-13T03:00:00.000Z'; // Segunda seguinte
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SEXTA', horaInicial: '14:00', horaFinal: '16:00' }
      ];

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toHaveProperty('count');
      expect(mockRes.data).toHaveProperty('aulas');
      expect(Array.isArray(mockRes.data.aulas)).toBe(true);
      expect(mockRes.data.count).toBeGreaterThanOrEqual(2);
      expect(mockRes.data.aulas.length).toBeGreaterThanOrEqual(2);
      expect(mockRes.data.aulas[0].tipo).toBe('PADRAO');
      expect(mockRes.data.aulas[0].observacao).toBeNull();
    });

    test('deve gerar aulas para período de um mês', async () => {
      mockReq.body.dataInicio = '2025-01-01T03:00:00.000Z';
      mockReq.body.dataFim = '2025-01-31T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBeGreaterThan(0);
      expect(mockRes.data.aulas.length).toBeGreaterThan(0);
    });

    test('deve incluir todas as propriedades necessárias em cada aula', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.aulas[0]).toHaveProperty('dataAula');
      expect(mockRes.data.aulas[0]).toHaveProperty('horaInicial');
      expect(mockRes.data.aulas[0]).toHaveProperty('horaFinal');
      expect(mockRes.data.aulas[0]).toHaveProperty('tipo');
      expect(mockRes.data.aulas[0]).toHaveProperty('observacao');
    });

    test('deve processar múltiplos dias da semana corretamente', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-12T03:00:00.000Z'; // Domingo
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '10:00', horaFinal: '12:00' },
        { diaSemana: 'SEXTA', horaInicial: '14:00', horaFinal: '16:00' }
      ];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBe(3);
      expect(mockRes.data.aulas.length).toBe(3);
    });
  });

  describe('Validações de entrada', () => {
    test('deve processar datas em formato ISO', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda em UTC = Segunda em SP
      mockReq.body.dataFim = '2025-01-06T23:59:59.999Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve aceitar diferentes horários', async () => {
      mockReq.body.dataInicio = '2025-01-06T03:00:00.000Z'; // Segunda
      mockReq.body.dataFim = '2025-01-06T03:00:00.000Z';
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '07:30', horaFinal: '09:45' }];

      // Criar nova instância com os dados atualizados
      const testController = new GenerateAulasByContratoController(mockReq, mockRes);

      await testController.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.aulas[0].horaInicial).toBe('07:30');
      expect(mockRes.data.aulas[0].horaFinal).toBe('09:45');
    });
  });
});
