import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateLivro extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['nome', 'idioma', 'nivel', 'ativo'];
  }

  getDataValidations(filteredData) {
    const { nome, idioma, nivel, ativo } = filteredData;

    return {
      // Validar campo nome
      nome: ValidateData.require()
        .isString()
        .minCharacters(2)
        .maxCharacters(255)
        .validate(nome, 'nome'),
      // Validar campo idioma
      idioma: ValidateData.require()
        .isString()
        .isEnum(['INGLES', 'ESPANHOL', 'FRANCES'])
        .validate(idioma, 'idioma'),
      // Validar campo nivel
      nivel: ValidateData.optional().isNumber().isPositive().validate(nivel, 'nivel'),
      // Validar campo ativo
      ativo: ValidateData.optional().isBoolean().validate(ativo, 'ativo')
    };
  }
}

/**
 * Middleware para validar dados de criação de livro
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateCreateLivro = (req, res, next) => {
  const validateCreateLivro = new ValidateCreateLivro(req, res, next);
  return validateCreateLivro.handle();
};
