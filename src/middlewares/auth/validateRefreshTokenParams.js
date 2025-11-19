import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateRefreshTokenParams extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['refreshToken'];
  }

  getDataValidations(filteredData) {
    const { refreshToken } = filteredData;

    return {
      // Validar campo refreshToken
      refreshToken: ValidateData.require()
        .isString()
        .minCharacters(20)
        .maxCharacters(500)
        .validate(refreshToken, 'refreshToken')
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

export const validateRefreshTokenParams = (req, res, next) => {
  const validateRefreshTokenParams = new ValidateRefreshTokenParams(req, res, next);
  return validateRefreshTokenParams.handle();
};
