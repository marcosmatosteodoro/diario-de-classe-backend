import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import cleanRequest from '../../../src/middlewares/cleanRequest.js';

describe('cleanRequest Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {}
    };
    res = {};
    next = jest.fn();
  });

  test('deve remover valores null de req.query', async () => {
    req.query = {
      validParam: 'value',
      nullParam: null,
      undefinedParam: undefined,
      emptyParam: '',
      nullStringParam: 'null'
    };

    await cleanRequest(req, res, next);

    expect(req.query).toEqual({
      validParam: 'value'
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('deve funcionar com objetos vazios', async () => {
    req.query = {};
    req.params = {};
    req.body = {};

    await cleanRequest(req, res, next);

    expect(req.query).toEqual({});
    expect(req.params).toEqual({});
    expect(req.body).toEqual({});
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('deve substituir req.query (getter sem cache, como no Express 5) por uma propriedade gravável comum', async () => {
    let parseCount = 0;
    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable: true,
      get() {
        parseCount += 1;
        // Simula o getter do Express 5: reparseia e devolve um objeto NOVO a
        // cada acesso, então qualquer mutação num acesso anterior se perde.
        return { validParam: 'value', nullParam: null };
      }
    });

    await cleanRequest(req, res, next);

    const descriptor = Object.getOwnPropertyDescriptor(req, 'query');
    expect(descriptor.get).toBeUndefined();
    expect(descriptor.writable).toBe(true);
    expect(parseCount).toBe(1);
    expect(req.query).toEqual({ validParam: 'value' });

    // Prova que a propriedade agora é fixa: uma mutação feita por um middleware
    // seguinte (como validateSearchQuery.js) persiste no próximo acesso, ao
    // contrário do getter original.
    req.query.validParam = 'outro valor';
    expect(req.query.validParam).toBe('outro valor');
  });
});
