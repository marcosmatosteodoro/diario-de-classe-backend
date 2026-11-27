import { jest } from '@jest/globals';
import { limitRequestsPerIp } from '../../../src/middlewares/limitRequestsPerIp.js';
import TentativaLoginRepository from '../../../src/repositories/tentativaLoginRepository.js';
import Constants from '../../../src/utilities/constants.js';

let req, res, next, incrementar;

beforeEach(() => {
  jest.replaceProperty(Constants, 'rateLimitGlobal', true);
  incrementar = jest
    .spyOn(TentativaLoginRepository.prototype, 'incrementar')
    .mockResolvedValue({ contagem: 1, segundosRestantes: 10 });
  req = { ip: undefined, method: 'GET', originalUrl: '/api/health', t: key => key };
  res = { status: jest.fn().mockReturnThis(), json: jest.fn(), set: jest.fn() };
  next = jest.fn();
});

describe('limitRequestsPerIp com ip indeterminado', () => {
  test('responde 503 sem chamar next nem o repository', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await limitRequestsPerIp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'api.errors.service_unavailable' });
    expect(next).toHaveBeenCalledTimes(0);
    expect(incrementar).toHaveBeenCalledTimes(0);
  });

  test('controle positivo: ip presente chama o repository uma vez e segue', async () => {
    req.ip = '203.0.113.9';

    await limitRequestsPerIp(req, res, next);

    expect(incrementar).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
