import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateContrato extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['dataDeInicio', 'dataDeTermino'];
  }

  getDataValidations(filteredData) {
    const { dataDeInicio, dataDeTermino } = filteredData;

    return {
      // Validar campo dataDeInicio
      dataDeInicio: ValidateData.require()
        .isString()
        .isDate()
        .validate(dataDeInicio, 'dataDeInicio'),
      // Validar campo dataDeTermino
      dataDeTermino: ValidateData.require()
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

export const validateUpdateContrato = (req, res, next) => {
  const validateUpdateContrato = new ValidateUpdateContrato(req, res, next);
  return validateUpdateContrato.handle();
};
