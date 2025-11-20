import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateDiaAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idAluno', 'idContrato', 'diaDaSemana', 'quantidadeDeAulas', 'horaDeInicio'];
  }

  getDataValidations(filteredData) {
    const { idAluno, idContrato, diaDaSemana, quantidadeDeAulas, horaDeInicio } = filteredData;

    return {
      // Validar campo idAluno
      idAluno: ValidateData.optional()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idAluno, 'idAluno'),
      // Validar campo idContrato
      idContrato: ValidateData.optional()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idContrato, 'idContrato'),
      // Validar campo diaDaSemana
      diaDaSemana: ValidateData.optional()
        .isString()
        .isEnum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'])
        .validate(diaDaSemana, 'diaDaSemana'),
      // Validar campo quantidadeDeAulas
      quantidadeDeAulas: ValidateData.optional()
        .isNumber()
        // .minValue(1) // TODO: definir valores mínimos e máximos reais
        // .maxValue(10)
        .validate(quantidadeDeAulas, 'quantidadeDeAulas'),
      // Validar campo horaDeInicio
      horaDeInicio: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .validate(horaDeInicio, 'horaDeInicio')
    };
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

export const validateUpdateDiaAula = (req, res, next) => {
  const validateUpdateDiaAula = new ValidateUpdateDiaAula(req, res, next);
  return validateUpdateDiaAula.handle();
};
