import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateGenerateAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['dataInicio', 'dataFim', 'diasAulas'];
  }

  getDataValidations(filteredData) {
    const { dataInicio, dataFim, diasAulas } = filteredData;

    return {
      // Validar campo dataInicio
      dataInicio: ValidateData.require().isString().isDate().validate(dataInicio, 'dataInicio'),
      // Validar campo dataFim
      dataFim: ValidateData.require()
        .isString()
        .isDate()
        .custom(
          this.dataFimIsAfterDataInicio.bind(this, dataInicio, dataFim),
          'dataFim deve ser posterior a dataInicio'
        )
        .validate(dataFim, 'dataFim'),
      // Validar campo aulas
      diasAulas: ValidateData.require()
        .isArray()
        .custom(value => this.validateDiasAulas(value), 'diasAulas inválido')
        .validate(diasAulas, 'diasAulas')
    };
  }

  validateDiasAulas(diasAulas) {
    const diasSemanaValidos = [
      'SEGUNDA',
      'TERCA',
      'QUARTA',
      'QUINTA',
      'SEXTA',
      'SABADO',
      'DOMINGO'
    ];

    if (!Array.isArray(diasAulas) || diasAulas.length === 0) {
      return false;
    }

    for (const diaAula of diasAulas) {
      const { diaSemana, horaInicial, horaFinal } = diaAula;

      if (
        !diaSemana ||
        !diasSemanaValidos.includes(diaSemana) ||
        !horaInicial ||
        typeof horaInicial !== 'string' ||
        horaInicial.length !== 5 ||
        !horaFinal ||
        typeof horaFinal !== 'string' ||
        horaFinal.length !== 5
      ) {
        return false;
      }
    }

    return true;
  }

  dataFimIsAfterDataInicio(dataInicio, dataFim) {
    if (!dataInicio || !dataFim) return false;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    return fim > inicio;
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

export const validateGenerateAula = (req, res, next) => {
  const validateGenerateAula = new ValidateGenerateAula(req, res, next);
  return validateGenerateAula.handle();
};
