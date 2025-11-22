import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateContrato extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['dataInicio', 'dataTermino'];
  }

  getDataValidations(filteredData) {
    const { dataInicio, dataTermino } = filteredData;

    return {
      // Validar campo dataInicio
      dataInicio: ValidateData.require().isString().isDate().validate(dataInicio, 'dataInicio'),
      // Validar campo dataTermino
      dataTermino: ValidateData.require()
        .isString()
        .isDate()
        .custom(
          this.dataTerminoIsAfterDataDeInicio.bind(dataInicio, dataTermino),
          'dataTermino deve ser posterior a dataInicio'
        )
        .validate(dataTermino, 'dataTermino')
    };
  }

  dataTerminoIsAfterDataDeInicio(dataInicio, dataTermino) {
    if (!dataInicio || !dataTermino) return true;

    const inicio = new Date(dataInicio);
    const termino = new Date(dataTermino);
    return termino > inicio;
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
