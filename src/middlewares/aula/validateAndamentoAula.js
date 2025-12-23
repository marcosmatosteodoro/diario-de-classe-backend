import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateAndamentoAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['status'];
  }

  getDataValidations(filteredData) {
    const { status } = filteredData;

    return {
      status: ValidateData.optional()
        .isString()
        .isEnum(['EM_ANDAMENTO', 'CANCELADA', 'CANCELADA_POR_FALTA', 'CONCLUIDA'])
        .validate(status, 'status')
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

export const validateAndamentoAula = (req, res, next) => {
  const validateAndamentoAula = new ValidateAndamentoAula(req, res, next);
  return validateAndamentoAula.handle();
};
