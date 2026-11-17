import { jest } from '@jest/globals';
import UserRepository from '../../../../src/repositories/userRepository.js';

// Contador manual: a config do Jest reseta a implementação de jest.fn entre testes.
const geracao = { chamadas: 0 };
const passwordReal = await import('../../../../src/utilities/password.js');
jest.unstable_mockModule('../../../../src/utilities/password.js', () => ({
  ...passwordReal,
  hashSenha: senha => {
    geracao.chamadas += 1;
    if (geracao.chamadas === 1) return Promise.reject(new Error('falha simulada'));
    return passwordReal.hashSenha(senha, { N: 2 ** 10, r: 8, p: 1 });
  }
}));
const { LoginService } = await import('../../../../src/services/auth/loginService.js');

describe('LoginService: falha na geração do hash fictício', () => {
  let originalSelectOne;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
    UserRepository.prototype.selectOne = async () => null;
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
  });

  test('e-mail inexistente devolve null (não lança) e a chamada seguinte gera de novo', async () => {
    await expect(LoginService.handle('x@example.com', 'password123')).resolves.toBeNull();
    expect(geracao.chamadas).toBe(1);

    await expect(LoginService.handle('x@example.com', 'password123')).resolves.toBeNull();
    expect(geracao.chamadas).toBe(2);

    await expect(LoginService.handle('x@example.com', 'password123')).resolves.toBeNull();
    expect(geracao.chamadas).toBe(2);
  });
});
