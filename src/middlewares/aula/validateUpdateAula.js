import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['dataAula', 'horaInicial', 'horaFinal', 'tipo', 'observacao'];
  }

  getDataValidations(filteredData) {
    const { dataAula, horaInicial, horaFinal, tipo, observacao } = filteredData;

    return {
      dataAula: ValidateData.optional().isString().isDate().validate(dataAula, 'dataAula'),
      // Validar campo horaInicial
      horaInicial: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .validate(horaInicial, 'horaInicial'),
      // Validar campo horaFinal
      horaFinal: ValidateData.optional()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(horaInicial, horaFinal),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(horaFinal, 'horaFinal'),
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

  horaFinalIsAfterHoraInicio(horaInicial, horaFinal) {
    if (!horaInicial || !horaFinal) return true;

    let inicial = horaInicial.replaceAll(':', '');
    let final = horaFinal.replaceAll(':', '');

    inicial = parseInt(inicial) || 0;
    final = parseInt(final) || 0;

    return final > inicial;
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
