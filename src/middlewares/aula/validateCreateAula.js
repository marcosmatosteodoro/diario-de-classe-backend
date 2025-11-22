import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return [
      'idAluno',
      'idProfessor',
      'idContrato',
      'dataAula',
      'horaInicio',
      'horaFim',
      'tipo',
      'observacao'
    ];
  }

  getDataValidations(filteredData) {
    const { idAluno, idProfessor, idContrato, dataAula, horaInicio, horaFim, tipo, observacao } =
      filteredData;

    return {
      // Validar campo idAluno
      idAluno: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idAluno, 'idAluno'),
      // Validar campo idProfessor
      idProfessor: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idProfessor, 'idProfessor'),
      // Validar campo criador
      idContrato: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idContrato, 'idContrato'),
      // Validar campo dataAula
      dataAula: ValidateData.require().isString().isDate().validate(dataAula, 'dataAula'),
      // Validar campo horaInicio
      horaInicio: ValidateData.require()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .validate(horaInicio, 'horaInicio'),
      // Validar campo horaFim
      horaFim: ValidateData.require()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .custom(
          () => this.horaFimIsAfterHoraInicio.bind(horaInicio, horaFim),
          'horaFim deve ser posterior a horaInicio'
        )
        .validate(horaFim, 'horaFim'),
      // Validar campo tipo
      tipo: ValidateData.require()
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

export const validateCreateAula = (req, res, next) => {
  const validateCreateAula = new ValidateCreateAula(req, res, next);
  return validateCreateAula.handle();
};
