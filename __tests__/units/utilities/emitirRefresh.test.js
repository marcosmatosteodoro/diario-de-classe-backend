import crypto from 'node:crypto';
import { jest } from '@jest/globals';
import { emitirRefresh } from '../../../src/utilities/emitirRefresh.js';
import Constants from '../../../src/utilities/constants.js';
import { parseJwt } from '../../../src/utilities/verifyJwt.js';

const DADOS = { sub: 'u-42', sid: 'sid-x', jti: 'jti-x', expiraEmEpoch: 1795000000 };

describe('emitirRefresh', () => {
  afterEach(() => jest.useRealTimers());

  test('exp é exatamente expiraEmEpoch, com o relógio em outro instante', () => {
    jest.useFakeTimers({ now: new Date('2026-11-18T15:00:00.000Z') });

    const { payload } = parseJwt(emitirRefresh(DADOS));

    expect(payload.exp).toBe(1795000000);
    expect(payload.iat).toBe(Math.floor(new Date('2026-11-18T15:00:00.000Z').getTime() / 1000));
  });

  test('claims exatas: sub, typ, sid, jti, iat, exp e nada mais', () => {
    const { payload } = parseJwt(emitirRefresh(DADOS));

    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'jti', 'sid', 'sub', 'typ']);
    expect(payload).toMatchObject({
      sub: 'u-42',
      typ: Constants.refreshTokenType,
      sid: 'sid-x',
      jti: 'jti-x'
    });
  });

  test('assina com jwtRefreshSecret (HS256)', () => {
    const [cabecalho, corpo, assinatura] = emitirRefresh(DADOS).split('.');
    const esperada = crypto
      .createHmac('sha256', Constants.jwtRefreshSecret)
      .update(`${cabecalho}.${corpo}`)
      .digest('base64url');

    expect(assinatura).toBe(esperada);
    expect(JSON.parse(Buffer.from(cabecalho, 'base64url').toString())).toEqual({
      alg: 'HS256',
      typ: 'JWT'
    });
  });
});
