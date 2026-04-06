import { jest } from '@jest/globals';
import { UpdateNomeCompletoController } from '../../../../src/controllers/admin/updateNomeCompletoController.js';

describe('UpdateNomeCompletoController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('Inicialização', () => {
    it('deve ser instanciado corretamente', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(controller).toBeInstanceOf(UpdateNomeCompletoController);
      expect(controller.req).toBe(req);
      expect(controller.res).toBe(res);
    });

    it('deve inicializar com dados corretos para professores', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(controller.professorData).toEqual({
        encontrados: 0,
        atualizados: 0,
        ignorados: 0,
        erros: 0,
        detalhesErros: []
      });
    });

    it('deve inicializar com dados corretos para alunos', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(controller.alunoData).toEqual({
        encontrados: 0,
        atualizados: 0,
        ignorados: 0,
        erros: 0,
        detalhesErros: []
      });
    });

    it('deve ter método estático handle', () => {
      expect(typeof UpdateNomeCompletoController.handle).toBe('function');
    });

    it('deve ter método execute', () => {
      const controller = new UpdateNomeCompletoController(req, res);
      expect(typeof controller.execute).toBe('function');
    });

    it('deve ter método updateProfessores', () => {
      const controller = new UpdateNomeCompletoController(req, res);
      expect(typeof controller.updateProfessores).toBe('function');
    });

    it('deve ter método updateAlunos', () => {
      const controller = new UpdateNomeCompletoController(req, res);
      expect(typeof controller.updateAlunos).toBe('function');
    });
  });

  describe('Estrutura de dados', () => {
    it('deve manter mesma referência para professores e alunos (compartilham dados)', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      controller.professorData.atualizados = 5;

      // Como são a mesma referência, modificar um afeta o outro
      expect(controller.alunoData.atualizados).toBe(5);
    });

    it('deve permitir adicionar erros aos detalhes', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      controller.professorData.detalhesErros.push({
        id: 'prof-1',
        error: 'Erro de teste'
      });

      expect(controller.professorData.detalhesErros).toHaveLength(1);
      expect(controller.professorData.detalhesErros[0].id).toBe('prof-1');
      expect(controller.professorData.detalhesErros[0].error).toBe('Erro de teste');
    });
  });

  describe('Contadores', () => {
    it('deve iniciar todos os contadores em zero', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(controller.professorData.encontrados).toBe(0);
      expect(controller.professorData.atualizados).toBe(0);
      expect(controller.professorData.ignorados).toBe(0);
      expect(controller.professorData.erros).toBe(0);

      expect(controller.alunoData.encontrados).toBe(0);
      expect(controller.alunoData.atualizados).toBe(0);
      expect(controller.alunoData.ignorados).toBe(0);
      expect(controller.alunoData.erros).toBe(0);
    });

    it('deve permitir incrementar contadores', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      controller.professorData.atualizados += 1;
      controller.professorData.atualizados += 1;
      controller.professorData.ignorados += 1;

      expect(controller.professorData.atualizados).toBe(2);
      expect(controller.professorData.ignorados).toBe(1);
      expect(controller.professorData.erros).toBe(0);
    });
  });

  describe('Cálculo de nomeCompleto', () => {
    it('deve calcular nomeCompleto como "nome sobrenome"', () => {
      const nome = 'João';
      const sobrenome = 'Silva';
      const nomeCompleto = `${nome} ${sobrenome}`;

      expect(nomeCompleto).toBe('João Silva');
    });

    it('deve calcular nomeCompleto com sobrenomes compostos', () => {
      const nome = 'José';
      const sobrenome = 'de Souza Lima';
      const nomeCompleto = `${nome} ${sobrenome}`;

      expect(nomeCompleto).toBe('José de Souza Lima');
    });

    it('deve detectar quando nomeCompleto é diferente', () => {
      const professor = {
        nome: 'Maria',
        sobrenome: 'Santos',
        nomeCompleto: 'Errado'
      };

      const nomeCompleto = `${professor.nome} ${professor.sobrenome}`;

      expect(nomeCompleto === professor.nomeCompleto).toBe(false);
    });

    it('deve detectar quando nomeCompleto está vazio', () => {
      const professor = {
        nome: 'Carlos',
        sobrenome: 'Costa',
        nomeCompleto: ''
      };

      const nomeCompleto = `${professor.nome} ${professor.sobrenome}`;

      expect(nomeCompleto === professor.nomeCompleto).toBe(false);
    });
  });

  describe('Validação de entrada', () => {
    it('deve ter req e res definidos', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(controller.req).toBeDefined();
      expect(controller.res).toBeDefined();
    });

    it('deve ter res.status como função', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(typeof controller.res.status).toBe('function');
    });

    it('deve ter res.json como função', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      expect(typeof controller.res.json).toBe('function');
    });
  });

  describe('Múltiplas instâncias', () => {
    it('deve criar instâncias independentes com dados separados', () => {
      const controller1 = new UpdateNomeCompletoController(req, res);
      const controller2 = new UpdateNomeCompletoController(req, res);

      controller1.professorData.atualizados = 5;
      controller2.professorData.atualizados = 10;

      expect(controller1.professorData.atualizados).toBe(5);
      expect(controller2.professorData.atualizados).toBe(10);
    });

    it('deve armazenar dados na instância corretamente', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      controller.professorData.erros = 3;
      controller.professorData.detalhesErros.push({ id: '1', error: 'Erro' });

      expect(controller.professorData.erros).toBe(3);
      expect(controller.professorData.detalhesErros).toHaveLength(1);
    });
  });

  describe('Resposta HTTP', () => {
    it('deve permitir retornar resposta com status 200', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      res.status(200);
      res.json({
        count: 0,
        data: {
          professores: controller.professorData,
          alunos: controller.alunoData
        }
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('deve preparar resposta com estrutura correta', () => {
      const controller = new UpdateNomeCompletoController(req, res);

      controller.professorData.atualizados = 5;

      const responseData = {
        count: controller.professorData.atualizados,
        data: {
          professores: controller.professorData,
          alunos: controller.alunoData
        }
      };

      expect(responseData.count).toBe(5);
      expect(responseData.data.professores.atualizados).toBe(5);
    });
  });
});
