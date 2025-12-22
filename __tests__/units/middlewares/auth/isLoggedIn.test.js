import isLoggedIn from '../../../../src/middlewares/auth/isLoggedIn.js';
import UnauthorizedError from '../../../../src/utilities/errors/unauthorized.js';
import crypto from 'crypto';
import Constants from '../../../../src/utilities/constants.js';

describe('isLoggedIn middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      t: key => {
        const translations = {
          'api.errors.unauthorized': 'Não autorizado'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      statusCode: null,
      data: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      }
    };

    mockNext = {
      called: false,
      arg: null,
      call: function (err) {
        this.called = true;
        this.arg = err;
      }
    };
  });

  test('should call next with UnauthorizedError when Authorization header missing', () => {
    isLoggedIn(mockReq, mockRes, err => mockNext.call(err));

    expect(mockNext.called).toBe(true);
    expect(mockNext.arg).toBeInstanceOf(UnauthorizedError);
  });

  test('should call next with UnauthorizedError when token malformed', () => {
    mockReq.headers.authorization = 'Bearer malformed.token';

    isLoggedIn(mockReq, mockRes, err => mockNext.call(err));

    expect(mockNext.called).toBe(true);
    expect(mockNext.arg).toBeInstanceOf(UnauthorizedError);
  });

  test('should call next with UnauthorizedError when token has invalid signature', () => {
    // header.payload.signature but signature won't match secret
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({ sub: '123', exp: Math.floor(Date.now() / 1000) + 60 })
    ).toString('base64');
    const badSig = 'invalidsignature';
    mockReq.headers.authorization = `Bearer ${header}.${payload}.${badSig}`;

    isLoggedIn(mockReq, mockRes, err => mockNext.call(err));

    expect(mockNext.called).toBe(true);
    expect(mockNext.arg).toBeInstanceOf(UnauthorizedError);
  });

  test('should call next with UnauthorizedError when token expired', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({ sub: '123', exp: Math.floor(Date.now() / 1000) - 10 })
    ).toString('base64');
    const sig = 'invalid';
    mockReq.headers.authorization = `Bearer ${header}.${payload}.${sig}`;

    isLoggedIn(mockReq, mockRes, err => mockNext.call(err));

    expect(mockNext.called).toBe(true);
    expect(mockNext.arg).toBeInstanceOf(UnauthorizedError);
  });

  test('should call next without error and set req.user when token valid', () => {
    // create a valid token using same algorithm as middleware
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadObj = { sub: '123', exp: Math.floor(Date.now() / 1000) + 60 };
    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const data = `${header}.${payload}`;
    const sig = crypto
      .createHmac('sha256', Constants.jwtSecret)
      .update(data)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    mockReq.headers.authorization = `Bearer ${data}.${sig}`;

    isLoggedIn(mockReq, mockRes, err => mockNext.call(err));

    expect(mockNext.called).toBe(true);
    expect(mockNext.arg).toBeUndefined();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.sub).toBe('123');
  });
});
