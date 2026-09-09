import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateCronograma extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    // idAluno, idContrato e idLivro nao sao editaveis: trocar de livro cria um
    // cronograma novo, para preservar o historico do aluno.
    return ['dataInicio', 'dataConclusao', 'ativo'];
  }

  getDataValidations(filteredData) {
    const { dataInicio, dataConclusao, ativo } = filteredData;

    return {
      // Validar campo dataInicio
      dataInicio: ValidateData.optional().isString().isDate().validate(dataInicio, 'dataInicio'),
      // Validar campo dataConclusao
      dataConclusao: ValidateData.optional()
        .isString()
        .isDate()
        .validate(dataConclusao, 'dataConclusao'),
      // Validar campo ativo
      ativo: ValidateData.optional().isBoolean().validate(ativo, 'ativo')
    };
  }
}

/**
 * Middleware para validar dados de atualização de cronograma do aluno
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateUpdateCronograma = (req, res, next) => {
  const validateUpdateCronograma = new ValidateUpdateCronograma(req, res, next);
  return validateUpdateCronograma.handle();
};
