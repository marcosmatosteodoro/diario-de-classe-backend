import { CreateContratoController } from '../../../../src/controllers/contrato/createContratoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('CreateContratoController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {
        idAluno: '1',
        idProfessor: '2',
        idioma: 'INGLES',
        dataInicio: '2025-01-10',
        dataTermino: '2025-12-31',
        status: 'ATIVO',
        SEGUNDA: {
          ativo: true,
          horaInicial: '08:00',
          quantidadeAulas: 2,
          duracaoAula: 60
        },
        TERCA: {
          ativo: false,
          horaInicial: '08:00',
          quantidadeAulas: 1,
          duracaoAula: 60
        },
        QUARTA: {
          ativo: true,
          horaInicial: '14:00',
          quantidadeAulas: 2,
          duracaoAula: 60
        },
        QUINTA: {
          ativo: false,
          horaInicial: '08:00',
          quantidadeAulas: 1,
          duracaoAula: 60
        },
        SEXTA: {
          ativo: true,
          horaInicial: '18:00',
          quantidadeAulas: 1,
          duracaoAula: 60
        },
        SABADO: {
          ativo: false,
          horaInicial: '08:00',
          quantidadeAulas: 1,
          duracaoAula: 60
        },
        DOMINGO: {
          ativo: false,
          horaInicial: '08:00',
          quantidadeAulas: 1,
          duracaoAula: 60
        },
        aulas: [
          {
            dataAula: '2025-01-13',
            horaInicial: '08:00',
            horaFinal: '09:00',
            tipo: 'PADRAO',
            status: 'AGENDADA',
            observacao: null
          }
        ]
      },
      t: key => {
        const translations = {
          'alunos.get.not_found': 'Aluno não encontrado',
          'professor.get.not_found': 'Professor não encontrado',
          'contratos.create.aluno_ativo_exists': 'Aluno já possui contrato ativo',
          'contratos.create.aluno_pendente_exists': 'Aluno já possui contrato pendente',
          'diaAulas.error.days_of_week_not_provided':
            'Nem todos os dias da semana foram fornecidos',
          'contratos.create.error': 'Erro ao criar contrato'
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

    controller = new CreateContratoController(mockReq, mockRes);
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(CreateContratoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar idAluno e idProfessor do body', () => {
      expect(controller.idAluno).toBe('1');
      expect(controller.idProfessor).toBe('2');
    });

    test('deve inicializar diasSemanas com todos os dias', () => {
      expect(controller.diasSemanas).toEqual([
        'SEGUNDA',
        'TERCA',
        'QUARTA',
        'QUINTA',
        'SEXTA',
        'SABADO',
        'DOMINGO'
      ]);
    });

    test('deve inicializar diasAulas como array vazio', () => {
      expect(controller.diasAulas).toEqual([]);
      expect(Array.isArray(controller.diasAulas)).toBe(true);
    });

    test('deve inicializar aulas como array vazio', () => {
      expect(controller.aulas).toEqual([]);
      expect(Array.isArray(controller.aulas)).toBe(true);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter método execute implementado', () => {
      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(CreateContratoController.handle).toBeDefined();
      expect(typeof CreateContratoController.handle).toBe('function');
    });

    test('deve ter método checkIfAllDaysOfWeekAreAvailable', () => {
      expect(typeof controller.checkIfAllDaysOfWeekAreAvailable).toBe('function');
    });

    test('deve ter método prepareDiasAulasData', () => {
      expect(typeof controller.prepareDiasAulasData).toBe('function');
    });

    test('deve ter método getDuracaoDaAula', () => {
      expect(typeof controller.getDuracaoDaAula).toBe('function');
    });

    test('deve ter método aulaPrepareData', () => {
      expect(typeof controller.aulaPrepareData).toBe('function');
    });

    test('deve ter método sortAulasByDate', () => {
      expect(typeof controller.sortAulasByDate).toBe('function');
    });
  });

  describe('checkIfAllDaysOfWeekAreAvailable', () => {
    test('deve retornar true quando todos os dias estão presentes', () => {
      const result = controller.checkIfAllDaysOfWeekAreAvailable(mockReq.body);

      expect(result).toBe(true);
    });

    test('deve retornar false quando falta um dia', () => {
      const bodyMissingDay = { ...mockReq.body };
      delete bodyMissingDay.SEGUNDA;

      const result = controller.checkIfAllDaysOfWeekAreAvailable(bodyMissingDay);

      expect(result).toBe(false);
    });

    test('deve retornar false quando faltam múltiplos dias', () => {
      const bodyMissingDays = { ...mockReq.body };
      delete bodyMissingDays.SEGUNDA;
      delete bodyMissingDays.QUARTA;

      const result = controller.checkIfAllDaysOfWeekAreAvailable(bodyMissingDays);

      expect(result).toBe(false);
    });
  });

  describe('calculateHoraFimByDuracaoAula', () => {
    test('deve calcular hora final com duração de 60 minutos', () => {
      const result = controller.calculateHoraFimByDuracaoAula({
        horaInicial: '08:00',
        duracaoAula: 60
      });

      expect(result).toBe('09:00');
    });

    test('deve calcular hora final com duração de 90 minutos', () => {
      const result = controller.calculateHoraFimByDuracaoAula({
        horaInicial: '08:00',
        duracaoAula: 90
      });

      expect(result).toBe('09:30');
    });

    test('deve calcular hora final com período noturno', () => {
      const result = controller.calculateHoraFimByDuracaoAula({
        horaInicial: '19:00',
        duracaoAula: 120
      });

      expect(result).toBe('21:00');
    });

    test('deve manter formato HH:MM', () => {
      const result = controller.calculateHoraFimByDuracaoAula({
        horaInicial: '08:30',
        duracaoAula: 45
      });

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('aulaPrepareData', () => {
    test('deve preparar dados da aula corretamente', () => {
      const aula = {
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        status: 'AGENDADA',
        observacao: null
      };

      const result = controller.aulaPrepareData({
        idAluno: '1',
        idProfessor: '2',
        idContrato: '1',
        aula
      });

      expect(result).toEqual({
        idAluno: '1',
        idProfessor: '2',
        idContrato: '1',
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        status: 'AGENDADA',
        observacao: null
      });
    });

    test('deve definir status como AGENDADA se não fornecido', () => {
      const aula = {
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        observacao: null
      };

      const result = controller.aulaPrepareData({
        idAluno: '1',
        idProfessor: '2',
        idContrato: '1',
        aula
      });

      expect(result.status).toBe('AGENDADA');
    });
  });

  describe('sortAulasByDate', () => {
    test('deve ordenar aulas por data', () => {
      controller.aulas = [
        { dataAula: new Date('2025-01-20'), id: 1 },
        { dataAula: new Date('2025-01-10'), id: 2 },
        { dataAula: new Date('2025-01-15'), id: 3 }
      ];

      controller.sortAulasByDate();

      expect(controller.aulas[0].id).toBe(2);
      expect(controller.aulas[1].id).toBe(3);
      expect(controller.aulas[2].id).toBe(1);
    });

    test('deve manter ordem quando já está ordenada', () => {
      controller.aulas = [
        { dataAula: new Date('2025-01-10'), id: 1 },
        { dataAula: new Date('2025-01-15'), id: 2 },
        { dataAula: new Date('2025-01-20'), id: 3 }
      ];

      controller.sortAulasByDate();

      expect(controller.aulas[0].id).toBe(1);
      expect(controller.aulas[1].id).toBe(2);
      expect(controller.aulas[2].id).toBe(3);
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof CreateContratoController.handle).toBe('function');
      expect(CreateContratoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(CreateContratoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve aceitar parâmetros req e res', () => {
      expect(CreateContratoController.handle.length).toBe(2);
    });
  });

  describe('Validações de entrada', () => {
    test('deve validar que todos os dias da semana são fornecidos', async () => {
      delete mockReq.body.SEGUNDA;

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Nem todos os dias da semana foram fornecidos');
    });

    test('deve lançar erro quando ocorrer exceção', async () => {
      mockReq.body = null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao criar contrato');
    });
  });
});
