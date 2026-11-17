import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateLoginParams extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['email', 'senha'];
  }

  getDataValidations(filteredData) {
    const { email, senha } = filteredData;

    return {
      // Validar campo email
      email: ValidateData.require().isString().maxCharacters(200).validate(email, 'email'),
      // Validar campo senha
      senha: ValidateData.require().isString().maxCharacters(200).validate(senha, 'senha')
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

export const validateLoginParams = (req, res, next) => {
  const validateLoginParams = new ValidateLoginParams(req, res, next);
  return validateLoginParams.handle();
};
