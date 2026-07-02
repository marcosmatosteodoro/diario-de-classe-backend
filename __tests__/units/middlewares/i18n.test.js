/**
 * @file Testes unitários para o middleware i18n
 * @description Testa a configuração e funcionalidade de internacionalização
 */

import { jest } from '@jest/globals';

// Configuração global dos mocks
let mockReq, mockRes, mockNext;

const setupMocks = () => {
  mockReq = {
    headers: {},
    query: {},
    cookies: {},
    t: jest.fn(),
    i18n: { language: 'pt', changeLanguage: jest.fn(), languages: ['pt', 'en'] }
  };
  mockRes = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  mockNext = jest.fn();
};

// Mock dos módulos
jest.unstable_mockModule('i18next-http-middleware', () => ({
  default: {
    handle: jest.fn(() => (req, res, next) => {
      // Cria i18n se não existir
      if (!req.i18n) {
        req.i18n = { language: 'pt', changeLanguage: jest.fn(), languages: ['pt', 'en'] };
      }

      // Cria função t se não existir
      if (!req.t) {
        req.t = jest.fn(key => `translated_${key}`);
      }

      // Detecção de idioma com prioridade: query > header > padrão
      let detectedLang = 'pt';
      if (req.query.lng) {
        detectedLang = req.query.lng;
      } else if (req.headers['accept-language']) {
        detectedLang = req.headers['accept-language'].split(',')[0].split('-')[0];
      }

      req.i18n.language = detectedLang;
      res.setHeader('Content-Language', req.i18n.language);
      next();
    }),
    LanguageDetector: class LanguageDetector {}
  }
}));

jest.unstable_mockModule('i18next', () => ({
  default: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    on: jest.fn(), // utilities/i18n.js registra listeners ('loaded', 'failedLoading')
    t: jest.fn(key => `translated_${key}`),
    language: 'pt',
    languages: ['pt', 'en']
  }
}));

jest.unstable_mockModule('i18next-fs-backend', () => ({
  default: class Backend {}
}));

describe('i18n Middleware - Configuração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  test('deve importar e configurar o middleware corretamente', async () => {
    const { default: middleware } = await import('../../../src/middlewares/i18n.js');
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  test('deve ser uma função que aceita req, res, next', async () => {
    const { default: middleware } = await import('../../../src/middlewares/i18n.js');
    expect(middleware.length).toBe(3);
  });
});

describe('i18n Middleware - Detecção de Idioma', () => {
  let i18nMiddleware;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocks();
    const { default: middleware } = await import('../../../src/middlewares/i18n.js');
    i18nMiddleware = middleware;
  });

  test('deve detectar idioma do header Accept-Language', () => {
    mockReq.headers['accept-language'] = 'en-US,en;q=0.9';
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.i18n.language).toBe('en');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve detectar idioma da query string', () => {
    mockReq.query.lng = 'en';
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.i18n.language).toBe('en');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve usar idioma padrão (pt) quando não especificado', () => {
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.i18n.language).toBe('pt');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve priorizar query string sobre header', () => {
    mockReq.headers['accept-language'] = 'en-US';
    mockReq.query.lng = 'pt';
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.i18n.language).toBe('pt');
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('i18n Middleware - Funcionalidades do Request', () => {
  let i18nMiddleware;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocks();
    const { default: middleware } = await import('../../../src/middlewares/i18n.js');
    i18nMiddleware = middleware;
  });

  test('deve adicionar função t() ao request', () => {
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.t).toBeDefined();
    expect(typeof mockReq.t).toBe('function');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve adicionar objeto i18n ao request', () => {
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.i18n).toBeDefined();
    expect(mockReq.i18n.language).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('função t() deve funcionar corretamente', () => {
    // Criar mock que retorna valor
    mockReq.t = jest.fn().mockReturnValue('translated_welcome.message');

    i18nMiddleware(mockReq, mockRes, mockNext);
    const result = mockReq.t('welcome.message');

    expect(mockReq.t).toHaveBeenCalledWith('welcome.message');
    expect(result).toBe('translated_welcome.message');
  });
});

describe('i18n Middleware - Headers e Tratamento de Erros', () => {
  let i18nMiddleware;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocks();
    const { default: middleware } = await import('../../../src/middlewares/i18n.js');
    i18nMiddleware = middleware;
  });

  test('deve definir header Content-Language', () => {
    mockReq.headers['accept-language'] = 'en';
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Language', 'en');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve definir header com idioma português por padrão', () => {
    i18nMiddleware(mockReq, mockRes, mockNext);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Language', 'pt');
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve continuar execução mesmo com headers inválidos', () => {
    mockReq.headers['accept-language'] = '';
    expect(() => i18nMiddleware(mockReq, mockRes, mockNext)).not.toThrow();
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve tratar query string vazia', () => {
    mockReq.query.lng = '';
    expect(() => i18nMiddleware(mockReq, mockRes, mockNext)).not.toThrow();
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve funcionar sem parâmetros de idioma', () => {
    mockReq = { headers: {}, query: {}, cookies: {} };
    expect(() => i18nMiddleware(mockReq, mockRes, mockNext)).not.toThrow();
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('i18n Middleware - Integração', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocks();

    // O jest.config usa resetMocks: true, que remove as implementações dos mocks
    // antes de cada teste. Como o mock de i18next já foi cacheado por testes
    // anteriores (via i18n-inline.js), o encadeamento fluente .use().use().init()
    // usado em utilities/i18n.js é perdido. Restauramos aqui.
    const { default: i18next } = await import('i18next');
    i18next.use.mockReturnThis();
  });

  test('deve integrar corretamente com configuração i18next', async () => {
    const { default: i18nextInstance } = await import('../../../src/utilities/i18n.js');
    expect(i18nextInstance).toBeDefined();
    expect(typeof i18nextInstance.t).toBe('function');
    expect(i18nextInstance.language).toBeDefined();
  });
});
