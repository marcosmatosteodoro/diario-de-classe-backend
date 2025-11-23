import { ValidateData } from '../../../src/utilities/validateData.js';

describe('ValidateData Utility', () => {
  // -------------------------
  // REQUIRE / OPTIONAL
  // -------------------------
  test('require deve falhar quando valor é vazio', () => {
    const validator = ValidateData.require();
    const result = validator.validate('', 'campo');

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('campo: Campo obrigatório');
  });

  test('optional deve aceitar valor vazio', () => {
    const validator = ValidateData.optional().isString();
    const result = validator.validate('', 'campo');

    expect(result.isValid).toBe(true);
  });

  // -------------------------
  // STRING
  // -------------------------
  test('isString deve validar corretamente strings', () => {
    const validator = ValidateData.isString();
    expect(validator.validate('abc').isValid).toBe(true);
    expect(validator.validate(123).isValid).toBe(false);
  });

  // -------------------------
  // NUMBER
  // -------------------------
  test('isNumber deve validar números e strings numéricas', () => {
    const validator = ValidateData.isNumber();

    expect(validator.validate(10).isValid).toBe(true);
    expect(validator.validate('42').isValid).toBe(true);
    expect(validator.validate('abc').isValid).toBe(false);
  });

  // -------------------------
  // BOOLEAN
  // -------------------------
  test('isBoolean deve validar booleans', () => {
    const validator = ValidateData.isBoolean();

    expect(validator.validate(true).isValid).toBe(true);
    expect(validator.validate(false).isValid).toBe(true);
    expect(validator.validate('true').isValid).toBe(false);
  });

  // -------------------------
  // ARRAY
  // -------------------------
  test('isArray deve validar arrays', () => {
    const validator = ValidateData.isArray();

    expect(validator.validate([1, 2]).isValid).toBe(true);
    expect(validator.validate('not array').isValid).toBe(false);
  });

  // -------------------------
  // EMAIL
  // -------------------------
  test('isEmail deve validar email corretamente', () => {
    const validator = ValidateData.isEmail();

    expect(validator.validate('valid@email.com').isValid).toBe(true);
    expect(validator.validate('invalid-email').isValid).toBe(false);
  });

  // -------------------------
  // ENUM
  // -------------------------
  test('isEnum deve validar valores do enum', () => {
    const validator = ValidateData.isEnum(['admin', 'user']);

    expect(validator.validate('admin').isValid).toBe(true);
    expect(validator.validate('guest').isValid).toBe(false);
  });

  test('isEnum deve lançar erro se enumValues não for array', () => {
    expect(() => ValidateData.isEnum('invalid')).toThrow();
  });

  // -------------------------
  // MIN/MAX CHARACTERS
  // -------------------------
  test('minCharacters deve validar tamanho mínimo', () => {
    const validator = ValidateData.minCharacters(3);

    expect(validator.validate('abc').isValid).toBe(true);
    expect(validator.validate('ab').isValid).toBe(false);
  });

  test('maxCharacters deve validar tamanho máximo', () => {
    const validator = ValidateData.maxCharacters(3);

    expect(validator.validate('abc').isValid).toBe(true);
    expect(validator.validate('abcd').isValid).toBe(false);
  });

  // -------------------------
  // POSITIVE / NOT ZERO
  // -------------------------
  test('isPositive deve validar números positivos', () => {
    const validator = ValidateData.isPositive();

    expect(validator.validate(5).isValid).toBe(true);
    expect(validator.validate(-1).isValid).toBe(false);
  });

  test('notZero deve validar números diferentes de zero', () => {
    const validator = ValidateData.notZero();

    expect(validator.validate(10).isValid).toBe(true);
    expect(validator.validate(0).isValid).toBe(false);
  });

  // -------------------------
  // DATE
  // -------------------------
  test('isDate deve validar datas', () => {
    const validator = ValidateData.isDate();

    expect(validator.validate('2024-01-01').isValid).toBe(true);
    expect(validator.validate('invalid-date').isValid).toBe(false);
  });

  // -------------------------
  // validateOrThrow
  // -------------------------
  test('validateOrThrow deve lançar erro quando inválido', () => {
    const validator = ValidateData.isString().minCharacters(3);

    expect(() => validator.validateOrThrow('ab', 'nome')).toThrow(
      'nome: Deve ter no mínimo 3 caracteres'
    );
  });

  test('validateOrThrow NÃO deve lançar erro quando válido', () => {
    const validator = ValidateData.isString().minCharacters(2);

    expect(() => validator.validateOrThrow('ok')).not.toThrow();
  });

  // -------------------------
  // CUSTOM VALIDATOR
  // -------------------------
  test('custom deve validar usando função personalizada', () => {
    const validator = ValidateData.optional().custom(v => v === 'abc', 'Valor deve ser ABC');

    expect(validator.validate('abc').isValid).toBe(true);
    expect(validator.validate('xyz').isValid).toBe(false);
  });
});
