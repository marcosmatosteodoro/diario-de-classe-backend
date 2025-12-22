import ExtendableError from '../../../../src/utilities/errors/extendableError.js';

describe('ExtendableError', () => {
  test('deve criar um erro com a mensagem correta', () => {
    const err = new ExtendableError('Algo deu errado');

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ExtendableError);
    expect(err.message).toBe('Algo deu errado');
  });

  test('deve criar um stack trace', () => {
    const err = new ExtendableError('Erro com stack');

    expect(err.stack).toBeDefined();
    expect(typeof err.stack).toBe('string');
    expect(err.stack.length).toBeGreaterThan(0);
  });
});
