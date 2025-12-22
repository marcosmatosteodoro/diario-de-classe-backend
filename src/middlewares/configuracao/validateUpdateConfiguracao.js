import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateConfiguracao extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['duracaoAula', 'tolerancia', 'diasDeFuncionamento'];
  }

  getDataValidations(filteredData) {
    const { duracaoAula, tolerancia, diasDeFuncionamento } = filteredData;

    return {
      // Validar campo duracaoAula
      duracaoAula: ValidateData.require()
        .isNumber()
        .isPositive()
        .notZero()
        .validate(duracaoAula, 'duracaoAula'),
      // Validar campo tolerancia
      tolerancia: ValidateData.require()
        .isNumber()
        .isPositive()
        .notZero()
        .validate(tolerancia, 'tolerancia'),
      // Validar campo diasDeFuncionamento
      diasDeFuncionamento: ValidateData.require()
        .isArray()
        .custom(this.diaSemanaIsValid.bind(this), 'Contém diaSemana inválido')
        .custom(this.horaInicialIsValid.bind(this), 'Contém horaInicial inválido')
        .custom(this.horaFinalIsValid.bind(this), 'Contém horaFinal inválido')
        .custom(this.ativoIsValid.bind(this), 'Contém ativo inválido')
        .custom(this.configuracaoIdIsValid.bind(this), 'Contém configuracaoId inválido')
        .custom(this.horasIsValid.bind(this), 'horaFinal deve ser maior que horaInicial')
        .validate(diasDeFuncionamento, 'diasDeFuncionamento')
    };
  }

  diaSemanaIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const diasValidos = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    return diasDeFuncionamento.every(value => diasValidos.includes(value.diaSemana));
  }

  horaInicialIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return diasDeFuncionamento.every(
      value => value && typeof value.horaInicial === 'string' && timeRegex.test(value.horaInicial)
    );
  }

  horaFinalIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    return diasDeFuncionamento.every(value => {
      if (!value || typeof value.horaInicial !== 'string' || typeof value.horaFinal !== 'string')
        return false;
      if (!timeRegex.test(value.horaInicial) || !timeRegex.test(value.horaFinal)) return false;
      // garante que horaFinal > horaInicial
      return toMinutes(value.horaFinal) > toMinutes(value.horaInicial);
    });
  }

  ativoIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(value => value && typeof value.ativo === 'boolean');
  }

  configuracaoIdIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(
      value => value && (typeof value.configuracaoId === 'string' || value.configuracaoId === null)
    );
  }

  horasIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(
      value => value && value.horaInicial !== value.horaFinal && value.horaInicial < value.horaFinal
    );
  }
}

/**
 * Middleware para validar dados de criação de usuário
 * Valida apenas o campo nome
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */

export const validateUpdateConfiguracao = (req, res, next) => {
  const validateUpdateConfiguracao = new ValidateUpdateConfiguracao(req, res, next);
  return validateUpdateConfiguracao.handle();
};
