import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateManyDiaAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idAluno', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
  }

  getDataValidations(filteredData) {
    const { idAluno, SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO } = filteredData;

    // Se index for undefined, é validação de item único (não deveria acontecer com isArray=true)
    return {
      // Validar campo idAluno
      idAluno: ValidateData.require()
        .isString()
        .minCharacters(6)
        .maxCharacters(50)
        .validate(idAluno, 'idAluno'),
      //Validar campo SEGUNDA
      SEGUNDA: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(SEGUNDA),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(SEGUNDA),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(SEGUNDA),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(SEGUNDA, 'SEGUNDA'),
      //Validar campo TERCA
      TERCA: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(TERCA),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(TERCA),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(TERCA),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(TERCA, 'TERCA'),
      //Validar campo QUARTA
      QUARTA: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(QUARTA),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(QUARTA),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(QUARTA),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(QUARTA, 'QUARTA'),
      //Validar campo QUINTA
      QUINTA: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(QUINTA),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(QUINTA),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(QUINTA),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(QUINTA, 'QUINTA'),
      //Validar campo SEXTA
      SEXTA: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(SEXTA),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(SEXTA),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(SEXTA),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(SEXTA, 'SEXTA'),
      //Validar campo SABADO
      SABADO: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(SABADO),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(SABADO),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(SABADO),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(SABADO, 'SABADO'),
      //Validar campo DOMINGO
      DOMINGO: ValidateData.require()
        .custom(
          () => this.validateQuantidadeAulas.bind(DOMINGO),
          'quantidadeAulas deve ser um número maior que 0'
        )
        .custom(
          () => this.validateHorarios.bind(DOMINGO),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(DOMINGO),
          'horaFinal deve ser posterior a horaInicial'
        )
        .validate(DOMINGO, 'DOMINGO')
    };
  }

  validateQuantidadeAulas({ quantidadeAulas }) {
    return !!quantidadeAulas && typeof quantidadeAulas === 'number' && quantidadeAulas > 0;
  }

  validateHorarios({ horaInicial, horaFinal }) {
    if (!horaInicial || !horaFinal) return true;
    return typeof horaInicial === 'string' && typeof horaFinal === 'string';
  }

  horaFinalIsAfterHoraInicio({ horaInicial, horaFinal }) {
    if (!horaInicial || !horaFinal) return true;

    let inicial = horaInicial.replaceAll(':', '');
    let final = horaFinal.replaceAll(':', '');

    inicial = parseInt(inicial) || 0;
    final = parseInt(final) || 0;

    return final > inicial;
  }
}

/**
 * Middleware para validar dados em lote de criação/atualização de dia de aula
 * Recebe um array de objetos e valida cada item do array
 *
 * @param {Object} req - Request object (req.body deve ser um array)
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateCreateManyDiaAula = (req, res, next) => {
  const validator = new ValidateCreateManyDiaAula(req, res, next);
  return validator.handle();
};
