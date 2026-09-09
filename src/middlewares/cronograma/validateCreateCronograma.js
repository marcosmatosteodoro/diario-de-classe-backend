import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateCronograma extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    // idAluno nao entra: vem sempre do parametro da rota, ja conferido contra o
    // vinculo do professor. Aceitar no corpo permitiria matricular aluno alheio.
    return ['idContrato', 'idLivro', 'dataInicio'];
  }

  getDataValidations(filteredData) {
    const { idContrato, idLivro, dataInicio } = filteredData;

    return {
      // Validar campo idContrato
      idContrato: ValidateData.require().isString().validate(idContrato, 'idContrato'),
      // Validar campo idLivro
      idLivro: ValidateData.require().isString().validate(idLivro, 'idLivro'),
      // Validar campo dataInicio
      dataInicio: ValidateData.optional().isString().isDate().validate(dataInicio, 'dataInicio')
    };
  }
}

/**
 * Middleware para validar dados de criação de cronograma do aluno
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateCreateCronograma = (req, res, next) => {
  const validateCreateCronograma = new ValidateCreateCronograma(req, res, next);
  return validateCreateCronograma.handle();
};
