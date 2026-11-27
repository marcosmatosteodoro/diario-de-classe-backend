import { jest } from '@jest/globals';
import { ReservarRequisicaoPorIpService } from '../../../../src/services/seguranca/reservarRequisicaoPorIpService.js';
import TentativaLoginRepository from '../../../../src/repositories/tentativaLoginRepository.js';
import Constants from '../../../../src/utilities/constants.js';

const LIMITE = 3;
const JANELA = 77;
const IP = '203.0.113.5';

// Repository falso: o AbstractService instancia a classe recebida.
let incrementar;
class FakeRepository {
  incrementar(...args) {
    return incrementar(...args);
  }
}

const executar = ip => new ReservarRequisicaoPorIpService(FakeRepository, ip).execute();

beforeEach(() => {
  incrementar = jest.fn();
  jest.replaceProperty(Constants, 'rateLimitMaxRequisicoes', LIMITE);
  jest.replaceProperty(Constants, 'rateLimitJanelaSegundos', JANELA);
});

describe('ReservarRequisicaoPorIpService.execute', () => {
  test.each([1, LIMITE])('contagem %p dentro do limite é permitida', async contagem => {
    incrementar.mockResolvedValue({ contagem, segundosRestantes: 9 });
    await expect(executar(IP)).resolves.toMatchObject({ permitido: true, primeiraRecusa: false });
  });

  test('a contagem limite + 1 recusa e marca a primeira recusa', async () => {
    incrementar.mockResolvedValue({ contagem: LIMITE + 1, segundosRestantes: 42 });
    await expect(executar(IP)).resolves.toEqual({
      permitido: false,
      segundosRestantes: 42,
      primeiraRecusa: true
    });
  });

  test('a contagem limite + 2 recusa sem marcar primeira recusa', async () => {
    incrementar.mockResolvedValue({ contagem: LIMITE + 2, segundosRestantes: 41 });
    await expect(executar(IP)).resolves.toEqual({
      permitido: false,
      segundosRestantes: 41,
      primeiraRecusa: false
    });
  });

  test('incrementa a chave com prefixo global e a janela configurada', async () => {
    incrementar.mockResolvedValue({ contagem: 1, segundosRestantes: 77 });
    await executar(IP);
    expect(incrementar).toHaveBeenCalledTimes(1);
    expect(incrementar).toHaveBeenCalledWith('global:203.0.113.5', 77);
  });

  test.each([undefined, null, ''])('ip %p rejeita sem tocar o repository', async ip => {
    await expect(executar(ip)).rejects.toThrow('ip_indeterminado');
    expect(incrementar).toHaveBeenCalledTimes(0);
  });

  test('controle positivo: ip presente chama o repository uma vez', async () => {
    incrementar.mockResolvedValue({ contagem: 1, segundosRestantes: 1 });
    await executar(IP);
    expect(incrementar).toHaveBeenCalledTimes(1);
  });

  test('falha do repository propaga a mesma instância do erro', async () => {
    const erro = new Error('banco fora');
    incrementar.mockRejectedValue(erro);
    await expect(executar(IP)).rejects.toBe(erro);
  });
});

describe('ReservarRequisicaoPorIpService concorrência', () => {
  // Incremento síncrono por chave, como o UPSERT ... RETURNING atômico do banco.
  const instalarStore = () => {
    const contagens = new Map();
    incrementar = jest.fn(async chave => {
      const contagem = (contagens.get(chave) ?? 0) + 1;
      contagens.set(chave, contagem);
      return { contagem, segundosRestantes: 5 };
    });
  };

  test('N+K chamadas simultâneas do mesmo ip liberam no máximo N', async () => {
    jest.replaceProperty(Constants, 'rateLimitMaxRequisicoes', 5);
    instalarStore();
    const resultados = await Promise.all(Array.from({ length: 8 }, () => executar(IP)));
    expect(resultados.filter(r => r.permitido)).toHaveLength(5);
    expect(resultados.filter(r => !r.permitido)).toHaveLength(3);
  });

  test('ips diferentes não somam entre si', async () => {
    jest.replaceProperty(Constants, 'rateLimitMaxRequisicoes', 5);
    instalarStore();
    const chamadas = [];
    for (let i = 0; i < 5; i += 1) {
      chamadas.push(executar('203.0.113.10'), executar('203.0.113.11'));
    }
    const resultados = await Promise.all(chamadas);
    expect(resultados.every(r => r.permitido)).toBe(true);
  });
});

describe('ReservarRequisicaoPorIpService.handle', () => {
  beforeEach(() => {
    jest
      .spyOn(TentativaLoginRepository.prototype, 'incrementar')
      .mockResolvedValue({ contagem: 1, segundosRestantes: 1 });
  });

  test('usa o TentativaLoginRepository com a chave do ip', async () => {
    await ReservarRequisicaoPorIpService.handle(IP);
    expect(TentativaLoginRepository.prototype.incrementar).toHaveBeenCalledTimes(1);
    expect(TentativaLoginRepository.prototype.incrementar).toHaveBeenCalledWith(
      'global:203.0.113.5',
      JANELA
    );
  });
});
