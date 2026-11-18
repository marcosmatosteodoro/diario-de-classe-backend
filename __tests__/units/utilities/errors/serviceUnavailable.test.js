import ServiceUnavailableError from '../../../../src/utilities/errors/serviceUnavailable.js';
import ExtendableError from '../../../../src/utilities/errors/extendableError.js';

describe('ServiceUnavailableError', () => {
  test('deve herdar de ExtendableError', () => {
    const err = new ServiceUnavailableError();

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ExtendableError);
    expect(err).toBeInstanceOf(ServiceUnavailableError);
  });

  test('deve possuir a mensagem padrão correta', () => {
    expect(new ServiceUnavailableError().message).toBe('ServiceUnavailableError');
  });

  test('deve possuir um stack trace', () => {
    const err = new ServiceUnavailableError();

    expect(typeof err.stack).toBe('string');
    expect(err.stack.length).toBeGreaterThan(0);
  });
});
