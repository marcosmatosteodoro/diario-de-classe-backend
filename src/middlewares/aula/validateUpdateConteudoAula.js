import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateConteudoAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idConteudo'];
  }

  getDataValidations(filteredData) {
    const { idConteudo } = filteredData;

    return {
      // Validar campo idConteudo. Nulo e valido: devolve a aula ao controle
      // automatico do resequenciador.
      idConteudo: ValidateData.optional()
        .isString()
        .maxCharacters(30)
        .validate(idConteudo, 'idConteudo')
    };
  }

  handle() {
    if (!this.req.body || !Object.keys(this.req.body).includes('idConteudo')) {
      return this.res.status(400).json({
        message: this.req.t ? this.req.t('validation.noData') : 'Dados não fornecidos'
      });
    }

    return super.handle();
  }
}

/**
 * Middleware para validar o lançamento de conteúdo em uma aula
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateUpdateConteudoAula = (req, res, next) => {
  const validateUpdateConteudoAula = new ValidateUpdateConteudoAula(req, res, next);
  return validateUpdateConteudoAula.handle();
};
