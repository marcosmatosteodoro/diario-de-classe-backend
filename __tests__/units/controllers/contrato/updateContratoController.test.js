import { UpdateContratoController } from '../../../../src/controllers/contrato/updateContratoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';
import { DeleteAulaService } from '../../../../src/services/aula/deleteAulaService.js';

describe('UpdateContratoController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: '1' },
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
      validatedId: '1',
      t: key => {
        const translations = {
          'contratos.get.not_found': 'Contrato não encontrado',
          'alunos.get.not_found': 'Aluno não encontrado',
          'professor.get.not_found': 'Professor não encontrado',
          'diaAulas.error.days_of_week_not_provided':
            'Nem todos os dias da semana foram fornecidos',
          'contratos.update.error': 'Erro ao atualizar contrato'
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

    controller = new UpdateContratoController(mockReq, mockRes);
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(UpdateContratoController);
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
    });

    test('deve inicializar aulas como array vazio', () => {
      expect(controller.aulas).toEqual([]);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter método execute implementado', () => {
      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(UpdateContratoController.handle).toBeDefined();
      expect(typeof UpdateContratoController.handle).toBe('function');
    });

    test('deve ter método updateContrato', () => {
      expect(typeof controller.updateContrato).toBe('function');
    });

    test('deve ter método createDiasAulas', () => {
      expect(typeof controller.createDiasAulas).toBe('function');
    });

    test('deve ter método createAulas', () => {
      expect(typeof controller.createAulas).toBe('function');
    });

    test('deve ter método checkIfAllDaysOfWeekAreAvailable', () => {
      expect(typeof controller.checkIfAllDaysOfWeekAreAvailable).toBe('function');
    });

    test('deve ter método calculateHoraFimByDuracaoAula', () => {
      expect(typeof controller.calculateHoraFimByDuracaoAula).toBe('function');
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

    test('deve manter formato HH:MM', () => {
      const result = controller.calculateHoraFimByDuracaoAula({
        horaInicial: '08:30',
        duracaoAula: 45
      });

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('prepareDiasAulasData', () => {
    test('deve preparar dados para todos os dias da semana', () => {
      const result = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 1,
        idContrato: 1
      });

      expect(result).toHaveLength(7);
      expect(result.every(dia => dia.idAluno === 1)).toBe(true);
      expect(result.every(dia => dia.idContrato === 1)).toBe(true);
    });

    test('deve converter quantidadeAulas para number', () => {
      const result = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 1,
        idContrato: 1
      });

      const segunda = result.find(dia => dia.diaSemana === 'SEGUNDA');
      expect(typeof segunda.quantidadeAulas).toBe('number');
      expect(segunda.quantidadeAulas).toBe(2);
    });

    test('deve incluir horaInicial e horaFinal', () => {
      const result = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 1,
        idContrato: 1
      });

      const segunda = result.find(dia => dia.diaSemana === 'SEGUNDA');
      expect(segunda).toHaveProperty('horaInicial');
      expect(segunda).toHaveProperty('horaFinal');
      expect(segunda.horaInicial).toBe('08:00');
    });
  });

  describe('aulaPrepareData', () => {
    test('deve preparar dados da aula para atualização', () => {
      const aula = {
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        status: 'AGENDADA',
        observacao: 'observação teste'
      };

      const result = controller.aulaPrepareData({
        idAluno: 1,
        idProfessor: 2,
        idContrato: 1,
        aula
      });

      expect(result).toEqual({
        idAluno: 1,
        idProfessor: 2,
        idContrato: 1,
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        status: 'AGENDADA',
        observacao: 'observação teste'
      });
    });

    test('deve usar status fornecido', () => {
      const aula = {
        dataAula: '2025-01-13',
        horaInicial: '08:00',
        horaFinal: '09:00',
        tipo: 'PADRAO',
        status: 'CONCLUIDA',
        observacao: null
      };

      const result = controller.aulaPrepareData({
        idAluno: 1,
        idProfessor: 2,
        idContrato: 1,
        aula
      });

      expect(result.status).toBe('CONCLUIDA');
    });
  });

  describe('sortAulasByDate', () => {
    test('deve ordenar aulas por data crescente', () => {
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

    test('deve retornar true após ordenar (para compatibilidade com sort)', () => {
      controller.aulas = [
        { dataAula: new Date('2025-01-20'), id: 1 },
        { dataAula: new Date('2025-01-10'), id: 2 }
      ];

      const result = controller.sortAulasByDate();

      expect(result).toBeDefined();
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof UpdateContratoController.handle).toBe('function');
      expect(UpdateContratoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(UpdateContratoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve aceitar parâmetros req e res', () => {
      expect(UpdateContratoController.handle.length).toBe(2);
    });
  });

  describe('Validações de entrada', () => {
    test('deve validar que todos os dias da semana são fornecidos', async () => {
      delete mockReq.body.SEGUNDA;

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Nem todos os dias da semana foram fornecidos');
    });

    test('deve validar se contrato existe', async () => {
      mockReq.validatedId = '999';

      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
    });

    test('deve validar se aluno existe', async () => {
      mockReq.body.idAluno = '999';

      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
    });

    test('deve lançar erro quando ocorrer exceção', async () => {
      mockReq.body = null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao atualizar contrato');
    });
  });

  // Regressão do bug: aulas existentes vêm do Prisma como Date e as recebidas
  // no body como string ISO. A comparação precisa casar por dia (não `===`),
  // senão toda edição apagava e recriava todas as aulas.
  describe('createAulas - reconciliação por data (Date x string)', () => {
    const originals = {};

    const buildController = aulas => {
      const req = {
        params: { id: '1' },
        body: { idAluno: '1', idProfessor: '2', aulas }
      };
      const res = {
        status() {
          return this;
        },
        json() {
          return this;
        }
      };
      const controller = new UpdateContratoController(req, res);
      controller.contrato = { id: 'contrato-1' };
      return controller;
    };

    beforeEach(() => {
      originals.list = GetAulaListService.handle;
      originals.create = CreateAulaService.handle;
      originals.update = UpdateAulaService.handle;
      originals.del = DeleteAulaService.handle;
    });

    afterEach(() => {
      GetAulaListService.handle = originals.list;
      CreateAulaService.handle = originals.create;
      UpdateAulaService.handle = originals.update;
      DeleteAulaService.handle = originals.del;
    });

    test('casa existente (Date) com recebida (string) e atualiza, sem deletar', async () => {
      let updateCalls = 0;
      let deleteCalls = 0;
      let createCalls = 0;

      GetAulaListService.handle = async () => [
        { id: 'aula-1', dataAula: new Date('2025-01-13T00:00:00.000Z') }
      ];
      UpdateAulaService.handle = async () => {
        updateCalls++;
        return { id: 'aula-1' };
      };
      DeleteAulaService.handle = async () => {
        deleteCalls++;
        return {};
      };
      CreateAulaService.handle = async () => {
        createCalls++;
        return {};
      };

      const controller = buildController([
        {
          dataAula: '2025-01-13',
          horaInicial: '08:00',
          horaFinal: '09:00',
          tipo: 'PADRAO'
        }
      ]);

      await controller.createAulas();

      expect(deleteCalls).toBe(0);
      expect(updateCalls).toBe(1);
      expect(createCalls).toBe(0);
    });

    test('deleta existente ausente na lista recebida e cria a nova', async () => {
      let updateCalls = 0;
      let deleteCalls = 0;
      let createCalls = 0;

      GetAulaListService.handle = async () => [
        { id: 'aula-old', dataAula: new Date('2025-01-06T00:00:00.000Z') }
      ];
      UpdateAulaService.handle = async () => {
        updateCalls++;
        return {};
      };
      DeleteAulaService.handle = async () => {
        deleteCalls++;
        return {};
      };
      CreateAulaService.handle = async () => {
        createCalls++;
        return { id: 'nova' };
      };

      const controller = buildController([
        {
          dataAula: '2025-01-13',
          horaInicial: '08:00',
          horaFinal: '09:00',
          tipo: 'PADRAO'
        }
      ]);

      await controller.createAulas();

      expect(deleteCalls).toBe(1);
      expect(updateCalls).toBe(0);
      expect(createCalls).toBe(1);
    });
  });
});
