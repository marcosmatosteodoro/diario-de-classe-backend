/**
 * Classe de validação de dados usando padrão Builder
 * Permite encadeamento de validações de forma fluente
 *
 * Exemplo de uso:
 * ValidateData.require().isString().minCharacters(3).maxCharacters(50).validate(value, 'nome');
 * ValidateData.isEmail().validate(email, 'email');
 * ValidateData.isNumber().validate(age, 'idade');
 * ValidateData.isEnum(['admin', 'user', 'guest']).validate(role, 'perfil');
 */
export class ValidateData {
  constructor() {
    this.validations = [];
    this.isRequired = false;
  }

  /**
   * Torna o campo obrigatório
   * @returns {ValidateData}
   */
  static require() {
    const instance = new ValidateData();
    instance.isRequired = true;
    instance.validations.push({
      type: 'required',
      validate: value => value !== null && value !== undefined && value !== '',
      message: 'Campo obrigatório'
    });
    return instance;
  }

  /**
   * Cria uma instância para campos opcionais
   * @returns {ValidateData}
   */
  static optional() {
    const instance = new ValidateData();
    instance.isRequired = false;
    return instance;
  }

  /**
   * Valida se o valor é um número
   * @returns {ValidateData}
   */
  static isNumber() {
    const instance = new ValidateData();
    return instance.isNumber();
  }

  /**
   * Valida se o valor é um número (método de instância)
   * @returns {ValidateData}
   */
  isNumber() {
    this.validations.push({
      type: 'number',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return !isNaN(value) && !isNaN(parseFloat(value));
      },
      message: 'Deve ser um número válido'
    });
    return this;
  }

  /**
   * Valida se o valor é uma data
   * @returns {ValidateData}
   */
  static isDate() {
    const instance = new ValidateData();
    return instance.isDate();
  }

  /**
   * Valida se o valor é uma data (método de instância)
   * @returns {ValidateData}
   */
  isDate() {
    this.validations.push({
      type: 'date',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
      },
      message: 'Deve ser uma data válida'
    });
    return this;
  }

  /**
   * Valida se o valor é uma string
   * @returns {ValidateData}
   */
  static isString() {
    const instance = new ValidateData();
    return instance.isString();
  }

  /**
   * Valida se o valor é uma string (método de instância)
   * @returns {ValidateData}
   */
  isString() {
    this.validations.push({
      type: 'string',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return typeof value === 'string';
      },
      message: 'Deve ser uma string válida'
    });
    return this;
  }

  /**
   * Valida o número máximo de caracteres
   * @param {number} max - Número máximo de caracteres
   * @returns {ValidateData}
   */
  static maxCharacters(max) {
    const instance = new ValidateData();
    return instance.maxCharacters(max);
  }

  /**
   * Valida o número máximo de caracteres (método de instância)
   * @param {number} max - Número máximo de caracteres
   * @returns {ValidateData}
   */
  maxCharacters(max) {
    this.validations.push({
      type: 'maxCharacters',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return String(value).length <= max;
      },
      message: `Deve ter no máximo ${max} caracteres`
    });
    return this;
  }

  /**
   * Valida o número mínimo de caracteres
   * @param {number} min - Número mínimo de caracteres
   * @returns {ValidateData}
   */
  static minCharacters(min) {
    const instance = new ValidateData();
    return instance.minCharacters(min);
  }

  /**
   * Valida o número mínimo de caracteres (método de instância)
   * @param {number} min - Número mínimo de caracteres
   * @returns {ValidateData}
   */
  minCharacters(min) {
    this.validations.push({
      type: 'minCharacters',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return String(value).length >= min;
      },
      message: `Deve ter no mínimo ${min} caracteres`
    });
    return this;
  }

  /**
   * Valida se o valor é um email válido
   * @returns {ValidateData}
   */
  static isEmail() {
    const instance = new ValidateData();
    return instance.isEmail();
  }

  /**
   * Valida se o valor é um email válido (método de instância)
   * @returns {ValidateData}
   */
  isEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.validations.push({
      type: 'email',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return emailRegex.test(String(value));
      },
      message: 'Deve ser um email válido'
    });
    return this;
  }

  /**
   * Valida se o valor está presente em um enum (array de valores válidos)
   * @param {Array} enumValues - Array com os valores válidos
   * @returns {ValidateData}
   */
  static isEnum(enumValues) {
    const instance = new ValidateData();
    return instance.isEnum(enumValues);
  }

  /**
   * Valida se o valor está presente em um enum (método de instância)
   * @param {Array} enumValues - Array com os valores válidos
   * @returns {ValidateData}
   */
  isEnum(enumValues) {
    if (!Array.isArray(enumValues)) {
      throw new Error('enumValues deve ser um array');
    }

    this.validations.push({
      type: 'enum',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return enumValues.includes(value);
      },
      message: `Deve ser um dos valores: ${enumValues.join(', ')}`
    });
    return this;
  }

  /**
   * Valida se o valor é um boolean
   * @returns {ValidateData}
   */
  static isBoolean() {
    const instance = new ValidateData();
    return instance.isBoolean();
  }

  /**
   * Valida se o valor é um boolean (método de instância)
   * @returns {ValidateData}
   */
  isBoolean() {
    this.validations.push({
      type: 'boolean',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        return typeof value === 'boolean';
      },
      message: 'Deve ser um valor booleano (true/false)'
    });
    return this;
  }

  /**
   * Valida se o valor é um número positivo (> 0)
   * @returns {ValidateData}
   */
  static isPositive() {
    const instance = new ValidateData();
    return instance.isPositive();
  }

  /**
   * Valida se o valor é um número positivo (> 0) (método de instância)
   * @returns {ValidateData}
   */
  isPositive() {
    this.validations.push({
      type: 'positive',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        // allow numeric strings as numbers
        const num = Number(value);
        return !isNaN(num) && num > 0;
      },
      message: 'Deve ser um número positivo'
    });
    return this;
  }

  /**
   * Valida se o valor é diferente de zero
   * @returns {ValidateData}
   */
  static notZero() {
    const instance = new ValidateData();
    return instance.notZero();
  }

  /**
   * Valida se o valor é diferente de zero (método de instância)
   * @returns {ValidateData}
   */
  notZero() {
    this.validations.push({
      type: 'notZero',
      validate: value => {
        if (value === null || value === undefined || value === '') {
          return !this.isRequired;
        }
        const num = Number(value);
        if (isNaN(num)) return false;
        return num !== 0;
      },
      message: 'Não pode ser zero'
    });
    return this;
  }

  /**
   * Executa todas as validações configuradas
   * @param {any} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo (para mensagens de erro)
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate(value, fieldName = 'campo') {
    const errors = [];

    for (const validation of this.validations) {
      if (!validation.validate(value)) {
        errors.push(`${fieldName}: ${validation.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Executa validações e lança erro se inválido
   * @param {any} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo
   * @throws {Error} - Lança erro com todas as mensagens de validação
   */
  validateOrThrow(value, fieldName = 'campo') {
    const result = this.validate(value, fieldName);
    if (!result.isValid) {
      throw new Error(result.errors.join(', '));
    }
  }

  /**
   * Adiciona validação customizada
   * @param {Function} validationFn - Função de validação que retorna boolean
   * @param {string} message - Mensagem de erro
   * @returns {ValidateData}
   */
  custom(validationFn, message) {
    this.validations.push({
      type: 'custom',
      validate: validationFn,
      message
    });
    return this;
  }
}
