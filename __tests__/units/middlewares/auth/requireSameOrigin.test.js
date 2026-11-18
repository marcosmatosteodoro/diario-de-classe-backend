import { jest } from '@jest/globals';
import requireSameOrigin from '../../../../src/middlewares/auth/requireSameOrigin.js';
import Constants from '../../../../src/utilities/constants.js';

const LISTADA = 'https://app.example.com';

describe('requireSameOrigin', () => {
  const corsOriginsOriginal = Constants.corsOrigins;
  let res;
  let next;
  let req;

  const montarReq = cabecalhos => {
    const porNome = Object.fromEntries(
      Object.entries(cabecalhos).map(([nome, valor]) => [nome.toLowerCase(), valor])
    );
    return { get: nome => porNome[nome.toLowerCase()], t: jest.fn(chave => chave) };
  };

  beforeEach(() => {
    Constants.corsOrigins = [LISTADA, 'http://localhost:3001'];
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    Constants.corsOrigins = corsOriginsOriginal;
  });

  const aceita = () => {
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  };

  const recusa = () => {
    expect(res.status).toHaveBeenCalledWith(403);
    expect(req.t).toHaveBeenCalledWith('api.errors.forbidden');
    expect(res.json).toHaveBeenCalledWith({ message: 'api.errors.forbidden' });
    expect(next).not.toHaveBeenCalled();
  };

  test('Origin listada sem Sec-Fetch-Site passa', () => {
    req = montarReq({ Origin: LISTADA });
    requireSameOrigin(req, res, next);
    aceita();
  });

  test('segunda origem da lista passa', () => {
    req = montarReq({ Origin: 'http://localhost:3001' });
    requireSameOrigin(req, res, next);
    aceita();
  });

  test('Origin listada com Sec-Fetch-Site same-origin passa', () => {
    req = montarReq({ Origin: LISTADA, 'Sec-Fetch-Site': 'same-origin' });
    requireSameOrigin(req, res, next);
    aceita();
  });

  test.each([
    ['Origin ausente', {}],
    ['Origin: null', { Origin: 'null' }],
    ['origem fora da lista', { Origin: 'https://evil.example.com' }],
    ['barra final', { Origin: `${LISTADA}/` }],
    ['caixa diferente', { Origin: 'HTTPS://APP.EXAMPLE.COM' }]
  ])('recusa com 403: %s', (_nome, cabecalhos) => {
    req = montarReq(cabecalhos);
    requireSameOrigin(req, res, next);
    recusa();
  });

  test.each(['same-site', 'cross-site', 'none'])(
    'recusa com 403: Origin listada com Sec-Fetch-Site %s',
    site => {
      req = montarReq({ Origin: LISTADA, 'Sec-Fetch-Site': site });
      requireSameOrigin(req, res, next);
      recusa();
    }
  );

  test('recusa com 403 quando a avaliação lança (fail secure)', () => {
    Constants.corsOrigins = null;
    req = montarReq({ Origin: LISTADA });
    requireSameOrigin(req, res, next);
    recusa();
  });
});
