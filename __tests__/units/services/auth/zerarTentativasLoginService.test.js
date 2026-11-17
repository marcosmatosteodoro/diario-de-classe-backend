import { jest } from '@jest/globals';
import { ZerarTentativasLoginService } from '../../../../src/services/auth/zerarTentativasLoginService.js';

describe('ZerarTentativasLoginService', () => {
  const novoRepository = () => {
    const repository = {
      removerPorChave: jest.fn().mockResolvedValue({ count: 1 }),
      decrementar: jest.fn().mockResolvedValue(1)
    };
    // AbstractService instancia o Repository: a classe devolve o dublê.
    return {
      repository,
      Repository: function () {
        return repository;
      }
    };
  };

  test('devolve a reserva do IP com o fim da janela informado e apaga a chave IP+e-mail', async () => {
    const { repository, Repository } = novoRepository();
    const expiraEm = new Date('2026-11-17T12:00:00.000Z');

    await new ZerarTentativasLoginService(
      Repository,
      '203.0.113.10',
      'a@example.com',
      expiraEm
    ).execute();

    expect(repository.decrementar).toHaveBeenCalledTimes(1);
    expect(repository.decrementar).toHaveBeenCalledWith(expect.stringMatching(/^ip:/), expiraEm);
    expect(repository.removerPorChave).toHaveBeenCalledTimes(1);
  });

  test.each([undefined, null])(
    'sem o fim da janela (%s) o IP não é devolvido, mas a chave IP+e-mail é apagada',
    async expiraEm => {
      const { repository, Repository } = novoRepository();

      await new ZerarTentativasLoginService(
        Repository,
        '203.0.113.10',
        'a@example.com',
        expiraEm
      ).execute();

      expect(repository.decrementar).not.toHaveBeenCalled();
      expect(repository.removerPorChave).toHaveBeenCalledTimes(1);
    }
  );
});
