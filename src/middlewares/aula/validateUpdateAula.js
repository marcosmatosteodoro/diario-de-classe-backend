import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['dataAula', 'horaInicio', 'horaFim', 'tipo', 'observacao'];
  }

  getDataValidations(filteredData) {
    const { dataAula, horaInicio, horaFim, tipo, observacao } = filteredData;

    return {
      dataAula: ValidateData.optional().isString().isDate().validate(dataAula, 'dataAula'),
      // Validar campo horaInicio
      horaInicio: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .validate(horaInicio, 'horaInicio'),
      // Validar campo horaFim
      horaFim: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .custom(
          () => this.horaFimIsAfterHoraInicio.bind(horaInicio, horaFim),
          'horaFim deve ser posterior a horaInicio'
        )
        .validate(horaFim, 'horaFim'),
      // Validar campo tipo
      tipo: ValidateData.optional()
        .isString()
        .isEnum(['PADRAO', 'REPOSICAO', 'OUTRA'])
        .validate(tipo, 'tipo'),
      // Validar campo observacao
      observacao: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(1000)
        .validate(observacao, 'observacao')
    };
  }

  horaFimIsAfterHoraInicio(horaInicio, horaFim) {
    if (!horaInicio || !horaFim) return true;

    let horaInicial = horaInicio.replaceAll(':', '');
    let horaFinal = horaFim.replaceAll(':', '');

    horaInicial = parseInt(horaInicial) || 0;
    horaFinal = parseInt(horaFinal) || 0;

    return horaFinal > horaInicial;
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

export const validateUpdateAula = (req, res, next) => {
  const validateUpdateAula = new ValidateUpdateAula(req, res, next);
  return validateUpdateAula.handle();
};
