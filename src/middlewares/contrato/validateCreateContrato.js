import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateContrato extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idDoAluno', 'dataDeInicio', 'dataDeTermino'];
  }

  getDataValidations(filteredData) {
    const { idDoAluno, dataDeInicio, dataDeTermino } = filteredData;

    return {
      // Validar campo idDoAluno
      idDoAluno: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idDoAluno, 'idDoAluno'),
      // Validar campo dataDeInicio
      dataDeInicio: ValidateData.optional()
        .isString()
        .isDate()
        .validate(dataDeInicio, 'dataDeInicio'),
      // Validar campo dataDeTermino
      dataDeTermino: ValidateData.optional()
        .isString()
        .isDate()
        .validate(dataDeTermino, 'dataDeTermino')
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

export const validateCreateContrato = (req, res, next) => {
  const validateCreateContrato = new ValidateCreateContrato(req, res, next);
  return validateCreateContrato.handle();
};
