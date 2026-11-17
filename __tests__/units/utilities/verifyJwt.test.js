import crypto from 'crypto';
import { verifyJwt } from '../../../src/utilities/verifyJwt.js';

const SEGREDO = 'segredo-de-teste';

const base64Url = obj =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const assinar = (payload, secret = SEGREDO) => {
  const data = `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
};

const agora = () => Math.floor(Date.now() / 1000);

describe('verifyJwt - expiração', () => {
  test('token com assinatura válida e exp futuro devolve o payload', () => {
    const exp = agora() + 3600;

    expect(verifyJwt(assinar({ id: 'u1', exp }), SEGREDO)).toEqual({ id: 'u1', exp });
  });

  test('token com assinatura válida e sem exp é recusado', () => {
    expect(verifyJwt(assinar({ id: 'u1' }), SEGREDO)).toBe(false);
  });

  test('token com exp não numérico é recusado', () => {
    expect(verifyJwt(assinar({ id: 'u1', exp: 'x' }), SEGREDO)).toBe(false);
  });

  test('token com exp passado é recusado', () => {
    expect(verifyJwt(assinar({ id: 'u1', exp: agora() - 10 }), SEGREDO)).toBe(false);
  });

  test('token com exp futuro e assinatura de outro segredo é recusado', () => {
    expect(verifyJwt(assinar({ id: 'u1', exp: agora() + 3600 }, 'outro'), SEGREDO)).toBe(false);
  });
});
