import UnauthorizedError from '../../../../src/utilities/errors/unauthorized.js';
import ExtendableError from '../../../../src/utilities/errors/extendableError.js';

describe('UnauthorizedError', () => {
  test('deve herdar de ExtendableError', () => {
    const err = new UnauthorizedError();

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ExtendableError);
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  test('deve possuir a mensagem padrão correta', () => {
    const err = new UnauthorizedError();

    expect(err.message).toBe('UnauthorizedError');
  });

  test('deve possuir um stack trace', () => {
    const err = new UnauthorizedError();

    expect(err.stack).toBeDefined();
    expect(typeof err.stack).toBe('string');
    expect(err.stack.length).toBeGreaterThan(0);
  });
});
