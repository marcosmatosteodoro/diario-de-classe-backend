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
});
