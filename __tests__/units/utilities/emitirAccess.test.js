import crypto from 'node:crypto';
import { emitirAccess } from '../../../src/utilities/emitirAccess.js';
import { generatePayload } from '../../../src/utilities/generatePayload.js';
import Constants from '../../../src/utilities/constants.js';
import { parseJwt } from '../../../src/utilities/verifyJwt.js';

const USER = { id: 'u-42', email: 'ana@example.com', permissao: 'professor' };

describe('emitirAccess', () => {
  test('assina com jwtSecret e leva generatePayload(user) mais sid e jti', () => {
    const token = emitirAccess(USER, 'sid-x');

    const [cabecalho, corpo, assinatura] = token.split('.');
    const esperada = crypto
      .createHmac('sha256', Constants.jwtSecret)
      .update(`${cabecalho}.${corpo}`)
      .digest('base64url');
    expect(assinatura).toBe(esperada);

    const { payload } = parseJwt(token);
    expect(payload).toMatchObject({ ...generatePayload(USER), sid: 'sid-x' });
    expect(typeof payload.jti).toBe('string');
    expect(payload.jti).not.toBe('');
    expect(payload.exp - payload.iat).toBe(Constants.accessExp);
  });

  test('duas chamadas devolvem jti diferentes', () => {
    const a = parseJwt(emitirAccess(USER, 'sid-x')).payload.jti;
    const b = parseJwt(emitirAccess(USER, 'sid-x')).payload.jti;

    expect(a).not.toBe(b);
  });
});
