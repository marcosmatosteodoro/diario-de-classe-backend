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
      'horaInicial',
      'horaFinal',
      'tipo',
      'observacao'
    ];
  }

  getDataValidations(filteredData) {
    const { idAluno, idProfessor, idContrato, dataAula, horaInicial, horaFinal, tipo, observacao } =
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
      // Validar campo horaInicial
      horaInicial: ValidateData.require()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .validate(horaInicial, 'horaInicial'),
      // Validar campo horaFinal
      horaFinal: ValidateData.require()
        .isString()
        .minCharacters(5)
        .maxCharacters(5)
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(horaInicial, horaFinal),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(horaFinal, 'horaFinal'),
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

export const validateCreateAula = (req, res, next) => {
  const validateCreateAula = new ValidateCreateAula(req, res, next);
  return validateCreateAula.handle();
};
