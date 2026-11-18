import { jest } from '@jest/globals';
import { cuid } from '../../../mocks/accessDeTeste.js';
import { capturarLog } from '../../../mocks/capturaDeLog.js';

const CAMINHO_CLIENT = '../../../../src/db/generated/client/index.js';
const CAMINHO_ETAPAS = '../../../../src/db/seeds/seedEtapas.js';
const CAMINHO_SEED = '../../../../src/db/seeds/seed.js';

const SENHA = 'valor-de-teste-do-seed';
const QUANT = {
  professores: 5,
  disponibilidadeProfessores: 35,
  alunos: 8,
  contratos: 8,
  diaAulas: 16,
  aulas: 148,
  livros: 20,
  configuracoes: 1
};

describe('Seed (função)', () => {
  const seedPasswordOriginal = process.env.SEED_PASSWORD;
  const contagem = { client: 0, etapas: 0 };
  let Constants;
  let isProductionOriginal;
  let exitSpy;
  let executarEtapas;

  const prepararMock = () => {
    executarEtapas = jest.fn(async () => QUANT);
    jest.unstable_mockModule(CAMINHO_CLIENT, () => ({
      PrismaClient: class {
        constructor() {
          contagem.client += 1;
        }
        async $connect() {}
        async $disconnect() {}
      }
    }));
    jest.unstable_mockModule(CAMINHO_ETAPAS, () => {
      contagem.etapas += 1;
      return { executarEtapas };
    });
  };

  const prepararReal = () => {
    jest.unstable_unmockModule(CAMINHO_ETAPAS);
    jest.unstable_mockModule(CAMINHO_CLIENT, () => ({
      PrismaClient: class {
        constructor() {
          contagem.client += 1;
        }
        async $connect() {}
        async $disconnect() {}
      }
    }));
  };

  // Depois do resetModules: o coletor precisa espiar os mesmos services que o seed carrega.
  const coletar = async () =>
    (await import('../../../mocks/coletorCreateServices.js')).coletarCreateServices();

  const carregarSeed = async () => (await import(CAMINHO_SEED)).default;

  beforeEach(async () => {
    jest.resetModules();
    contagem.client = 0;
    contagem.etapas = 0;
    ({ default: Constants } = await import('../../../../src/utilities/constants.js'));
    isProductionOriginal = Constants.isProduction;
    Constants.isProduction = false;
    process.env.SEED_PASSWORD = SENHA;
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`exit:${code}`);
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    Constants.isProduction = isProductionOriginal;
    if (seedPasswordOriginal === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = seedPasswordOriginal;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('carregar o módulo', () => {
    test('não avalia as etapas, não constrói o client e não encerra o processo', async () => {
      prepararMock();

      await expect(import(CAMINHO_SEED)).resolves.toBeDefined();

      expect(contagem.etapas).toBe(0);
      expect(contagem.client).toBe(0);
      expect(exitSpy).not.toHaveBeenCalled();
    });

    test('controle positivo: chamar grava e devolve o controle com as quantidades', async () => {
      prepararMock();
      const Seed = await carregarSeed();

      await expect(Seed.handle()).resolves.toEqual(QUANT);

      expect(contagem.etapas).toBe(1);
      expect(executarEtapas).toHaveBeenCalledTimes(1);
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('recusa antes de qualquer conexão', () => {
    let createUserSpy;

    beforeEach(async () => {
      prepararMock();
      const { CreateUserService } = await import(
        '../../../../src/services/user/createUserService.js'
      );
      createUserSpy = jest.spyOn(CreateUserService, 'handle').mockResolvedValue({});
    });

    test('em produção rejeita sem avaliar as etapas', async () => {
      Constants.isProduction = true;
      const Seed = await carregarSeed();

      await expect(Seed.handle()).rejects.toThrow();

      expect(contagem.etapas).toBe(0);
      expect(executarEtapas).not.toHaveBeenCalled();
      expect(createUserSpy).not.toHaveBeenCalled();
    });

    test('sem SEED_PASSWORD rejeita sem avaliar as etapas', async () => {
      delete process.env.SEED_PASSWORD;
      const Seed = await carregarSeed();

      await expect(Seed.handle()).rejects.toThrow();

      expect(contagem.etapas).toBe(0);
      expect(executarEtapas).not.toHaveBeenCalled();
      expect(createUserSpy).not.toHaveBeenCalled();
    });

    test('controle positivo: fora de produção e com senha avalia as etapas 1 vez', async () => {
      const Seed = await carregarSeed();

      await expect(Seed.handle()).resolves.toEqual(QUANT);

      expect(contagem.etapas).toBe(1);
      expect(executarEtapas).toHaveBeenCalledTimes(1);
    });
  });

  describe('fiação da senha', () => {
    test('executarEtapas recebe a senha do ambiente, literal', async () => {
      prepararMock();
      const Seed = await carregarSeed();

      await Seed.handle();

      expect(executarEtapas.mock.calls[0][0].senha).toBe('valor-de-teste-do-seed');
    });
  });

  describe('instante informado e dia civil de São Paulo', () => {
    test.each([
      ['23h30 em SP ainda é o dia 10', '2026-03-10T23:30:00-03:00', '2026-03-10'],
      ['00h30 em SP já é o dia 11', '2026-03-11T00:30:00-03:00', '2026-03-11']
    ])('%s', async (_, agora, esperado) => {
      prepararMock();
      const Seed = await carregarSeed();

      await Seed.handle({ agora: new Date(agora) });

      expect(executarEtapas.mock.calls[0][0].hoje).toBe(esperado);
    });

    test('sem agora usa o relógio do sistema', async () => {
      prepararMock();
      const Seed = await carregarSeed();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-10T23:30:00-03:00'));

      await Seed.handle();

      expect(executarEtapas.mock.calls[0][0].hoje).toBe('2026-03-10');
    });

    test('agora inválido rejeita com RangeError sem executar as etapas', async () => {
      prepararMock();
      const Seed = await carregarSeed();

      await expect(Seed.handle({ agora: new Date('x') })).rejects.toThrow(RangeError);

      expect(executarEtapas).not.toHaveBeenCalled();
    });
  });

  describe('falha chega ao chamador como erro', () => {
    test('a mesma instância do erro das etapas, sem encerrar o processo', async () => {
      prepararMock();
      const erro = new Error('falha-sentinela');
      executarEtapas.mockRejectedValueOnce(erro);
      const Seed = await carregarSeed();

      await expect(Seed.handle()).rejects.toBe(erro);

      expect(exitSpy).not.toHaveBeenCalled();
    });

    describe('com as etapas reais', () => {
      let coletor;

      beforeEach(async () => {
        prepararReal();
        coletor = await coletar();
        const { ConfiguracaoEscolaSeed } = await import(
          '../../../../src/db/seeds/models/configuracaoEscolaSeed.js'
        );
        const { UpdateAulasContratoService } = await import(
          '../../../../src/services/contrato/updateAulasContratoService.js'
        );
        jest
          .spyOn(ConfiguracaoEscolaSeed, 'handle')
          .mockImplementation(async () => ({ configuracoes: 1, dias: [] }));
        jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
      });

      test('falha na 3ª gravação de aula rejeita e não encerra o processo', async () => {
        let chamadas = 0;
        coletor.spies.aula.mockImplementation(async data => {
          chamadas += 1;
          if (chamadas === 3) throw new Error('falha-na-3a-aula');
          return { id: cuid(`aula${chamadas}`), ...data };
        });
        const Seed = await carregarSeed();

        await expect(Seed.handle()).rejects.toThrow('falha-na-3a-aula');

        expect(chamadas).toBe(3);
        expect(exitSpy).not.toHaveBeenCalled();
      });

      test('controle positivo: sem falha resolve com as contagens', async () => {
        const Seed = await carregarSeed();

        await expect(Seed.handle()).resolves.toMatchObject({ professores: 5, alunos: 8 });
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('log da execução sem dado pessoal', () => {
    test('registra seed.executado com instante, ambiente e contagens, sem e-mail, senha, nome ou telefone', async () => {
      prepararReal();
      await coletar();
      const { ConfiguracaoEscolaSeed } = await import(
        '../../../../src/db/seeds/models/configuracaoEscolaSeed.js'
      );
      const { UpdateAulasContratoService } = await import(
        '../../../../src/services/contrato/updateAulasContratoService.js'
      );
      jest
        .spyOn(ConfiguracaoEscolaSeed, 'handle')
        .mockImplementation(async () => ({ configuracoes: 1, dias: [] }));
      jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
      const { ALUNOS_DEMO } = await import('../../../../src/db/seeds/seedCatalogo.js');
      const Seed = await carregarSeed();
      const captura = capturarLog();

      await Seed.handle({ agora: new Date('2026-03-10T23:30:00-03:00') });
      const texto = captura.texto();

      expect(texto).toContain('seed.executado');
      expect(texto).toContain('2026-03-11T02:30:00.000Z');
      expect(texto).toContain(String(Constants.env));
      expect(texto).toContain('professores');
      expect(texto).not.toContain('@example.com');
      expect(texto).not.toContain(SENHA);
      expect(texto).not.toContain(ALUNOS_DEMO[0].nome);
      expect(texto).not.toMatch(/\b\d{10,11}\b/);

      const controle = capturarLog();
      for (const sentinela of ['x@example.com', SENHA, ALUNOS_DEMO[0].nome, '11987654321']) {
        console.info('controle', sentinela);
        expect(controle.texto()).toContain(sentinela);
      }
    });
  });
});
