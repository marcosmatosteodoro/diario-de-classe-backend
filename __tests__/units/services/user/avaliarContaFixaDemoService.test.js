import Constants from '../../../../src/utilities/constants.js';
import { AvaliarContaFixaDemoService } from '../../../../src/services/user/avaliarContaFixaDemoService.js';

const FIXA = 'fixa@example.com';
const contaFixa = () => ({ email: FIXA, resetarSenha: false, permissao: 'admin' });
const editar = (body, ...conta) =>
  AvaliarContaFixaDemoService.handle({
    acao: 'editar',
    contaAtual: conta.length ? conta[0] : contaFixa(),
    body
  });
const excluir = (...conta) =>
  AvaliarContaFixaDemoService.handle({
    acao: 'excluir',
    contaAtual: conta.length ? conta[0] : contaFixa(),
    body: {}
  });

describe('AvaliarContaFixaDemoService', () => {
  const demoModeOriginal = Constants.demoMode;
  const listaOriginal = Constants.demoContasFixas;

  beforeEach(() => {
    Constants.demoMode = true;
    Constants.demoContasFixas = [FIXA];
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
    delete Constants.demoContasFixas;
    Constants.demoContasFixas = listaOriginal;
  });

  describe('exclusão', () => {
    test('conta fixa é recusada', () => {
      expect(excluir()).toEqual({ recusar: true });
    });

    test('conta comum não é recusada', () => {
      expect(excluir({ ...contaFixa(), email: 'outra@example.com' })).toEqual({ recusar: false });
    });

    test('conta que só difere da lista na caixa é conta comum', () => {
      expect(excluir({ ...contaFixa(), email: 'FIXA@example.com' })).toEqual({ recusar: false });
    });
  });

  describe('edição de conta fixa, um campo por vez', () => {
    test.each([
      ['senha fornecida', { senha: 'nova' }, true],
      ["senha ''", { senha: '' }, false],
      ["senha '   '", { senha: '   ' }, false],
      ['senha null', { senha: null }, false],
      ['senha undefined', { senha: undefined }, false],
      ['senha numérica', { senha: 123 }, false],
      ['resetarSenha true', { resetarSenha: true }, true],
      ['resetarSenha false', { resetarSenha: false }, false],
      ['resetarSenha undefined', { resetarSenha: undefined }, false],
      ['resetarSenha null', { resetarSenha: null }, true],
      ['email com caixa diferente', { email: 'FIXA@example.com' }, true],
      ['email com espaço', { email: ' fixa@example.com' }, true],
      ['email idêntico', { email: 'fixa@example.com' }, false],
      ['email undefined', { email: undefined }, false],
      ['email null', { email: null }, true],
      ['permissao member', { permissao: 'member' }, true],
      ['permissao idêntica', { permissao: 'admin' }, false],
      ['permissao undefined', { permissao: undefined }, false],
      ['permissao null', { permissao: null }, true]
    ])('%s', (_nome, body, recusar) => {
      expect(editar(body)).toEqual({ recusar });
    });

    test('só nome, sobrenome e telefone não é recusado', () => {
      expect(editar({ nome: 'N', sobrenome: 'S', telefone: '11999990000' })).toEqual({
        recusar: false
      });
    });

    test('campos permitidos mais protegidos reenviados idênticos não é recusado', () => {
      expect(
        editar({
          nome: 'N',
          sobrenome: 'S',
          telefone: '11999990000',
          email: FIXA,
          permissao: 'admin',
          resetarSenha: false
        })
      ).toEqual({ recusar: false });
    });

    test('conta que só difere da lista na caixa, com senha, é conta comum', () => {
      expect(editar({ senha: 'nova' }, { ...contaFixa(), email: 'FIXA@example.com' })).toEqual({
        recusar: false
      });
    });
  });

  describe('modo desligado ou lista vazia', () => {
    const instalarLeitor = () => {
      const leitura = { n: 0 };
      Object.defineProperty(Constants, 'demoContasFixas', {
        get: () => {
          leitura.n += 1;
          return [FIXA];
        },
        configurable: true
      });
      return leitura;
    };

    test('modo desligado não recusa edição nem exclusão e não lê a lista', () => {
      Constants.demoMode = false;
      const leitura = instalarLeitor();

      expect(editar({ senha: 'nova' })).toEqual({ recusar: false });
      expect(excluir()).toEqual({ recusar: false });
      expect(leitura.n).toBe(0);
    });

    test('controle positivo: modo ligado lê a lista', () => {
      const leitura = instalarLeitor();

      editar({ senha: 'nova' });

      expect(leitura.n).toBeGreaterThanOrEqual(1);
    });

    test('modo ligado com lista vazia permite trocar a senha', () => {
      Constants.demoContasFixas = [];

      expect(editar({ senha: 'nova' })).toEqual({ recusar: false });
    });
  });

  describe('falha técnica nega (fail secure)', () => {
    const cenarios = [
      [
        'lista que não é array',
        () => {
          Constants.demoContasFixas = FIXA;
        },
        contaFixa()
      ],
      ['contaAtual null', () => {}, null],
      ['contaAtual undefined', () => {}, undefined],
      [
        'lista cujo getter lança',
        () => {
          Object.defineProperty(Constants, 'demoContasFixas', {
            get: () => {
              throw new Error('falha');
            },
            configurable: true
          });
        },
        contaFixa()
      ]
    ];

    test.each(cenarios)('%s: editar e excluir recusam', (_nome, preparar, conta) => {
      preparar();

      expect(editar({ nome: 'N' }, conta)).toEqual({ recusar: true });
      expect(excluir(conta)).toEqual({ recusar: true });
    });

    test('modo desligado ignora lista inválida', () => {
      Constants.demoMode = false;
      Constants.demoContasFixas = FIXA;

      expect(editar({ senha: 'nova' })).toEqual({ recusar: false });
      expect(excluir()).toEqual({ recusar: false });
    });
  });
});
