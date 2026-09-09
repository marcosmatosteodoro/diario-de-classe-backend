import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateConteudoLivro extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['ordem', 'titulo', 'descricao'];
  }

  getDataValidations(filteredData) {
    const { ordem, titulo, descricao } = filteredData;

    return {
      // Validar campo ordem
      ordem: ValidateData.optional().isNumber().isPositive().validate(ordem, 'ordem'),
      // Validar campo titulo
      titulo: ValidateData.optional()
        .isString()
        .minCharacters(1)
        .maxCharacters(255)
        .validate(titulo, 'titulo'),
      // Validar campo descricao
      descricao: ValidateData.optional()
        .isString()
        .maxCharacters(2000)
        .validate(descricao, 'descricao')
    };
  }
}

/**
 * Middleware para validar dados de atualização de conteúdo de livro
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateUpdateConteudoLivro = (req, res, next) => {
  const validateUpdateConteudoLivro = new ValidateUpdateConteudoLivro(req, res, next);
  return validateUpdateConteudoLivro.handle();
};
