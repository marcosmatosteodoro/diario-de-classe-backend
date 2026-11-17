import { redactErrorForLog } from '../../../src/utilities/redactErrorForLog.js';

describe('redactErrorForLog', () => {
  const prismaError = (extra = {}) =>
    Object.assign(new Error('Invalid `prisma.x.create()` valor-sensivel'), {
      name: 'PrismaClientKnownRequestError',
      ...extra
    });

  test('erro Prisma vira apenas name, code e chaves de meta', () => {
    const redacted = redactErrorForLog(
      prismaError({ code: 'P2002', meta: { target: 'valor-sensivel', modelName: 'Aluno' } })
    );

    expect(redacted).toEqual({
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: ['target', 'modelName']
    });
    expect(JSON.stringify(redacted)).not.toContain('valor-sensivel');
  });

  test('erro Prisma sem code nem meta devolve só name', () => {
    expect(redactErrorForLog(prismaError())).toEqual({ name: 'PrismaClientKnownRequestError' });
  });

  test('erro não-Prisma é devolvido sem alteração', () => {
    const err = new Error('falha comum');

    expect(redactErrorForLog(err)).toBe(err);
  });

  test('valor sem name string é devolvido sem alteração', () => {
    expect(redactErrorForLog(undefined)).toBeUndefined();
    const obj = { message: 'x' };
    expect(redactErrorForLog(obj)).toBe(obj);
  });
});
