import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateContrato extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idAluno', 'dataInicio', 'dataTermino'];
  }

  getDataValidations(filteredData) {
    const { idAluno, dataInicio, dataTermino } = filteredData;

    return {
      // Validar campo idAluno
      idAluno: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idAluno, 'idAluno'),
      // Validar campo dataInicio
      dataInicio: ValidateData.optional().isString().isDate().validate(dataInicio, 'dataInicio'),
      // Validar campo dataTermino
      dataTermino: ValidateData.optional()
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

export const validateCreateContrato = (req, res, next) => {
  const validateCreateContrato = new ValidateCreateContrato(req, res, next);
  return validateCreateContrato.handle();
};
