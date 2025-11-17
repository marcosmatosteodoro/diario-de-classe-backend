import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateUpdateDisponibilidadeProfessor extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
    this.disponibilidades = req.body;
  }

  getDataForFilter() {
    return [];
  }

  getDataValidations() {
    const disponibilidades = this.disponibilidades;

    return {
      disponibilidades: ValidateData.require()
        .isArray()
        .custom(this.diaDaSemanaIsValid.bind(this), 'Contém diaDaSemana inválido')
        .custom(this.horaInicialIsValid.bind(this), 'Contém horaInicial inválido')
        .custom(this.horaFinalIsValid.bind(this), 'Contém horaFinal inválido')
        .custom(this.ativoIsValid.bind(this), 'Contém ativo inválido')
        .custom(this.userIdIsValid.bind(this), 'Contém userId inválido')
        .custom(this.horasIsValid.bind(this), 'horaFinal deve ser maior que horaInicial')
        .validate(disponibilidades, 'disponibilidades')
    };
  }

  diaDaSemanaIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const diasValidos = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    return diasDeFuncionamento.every(value => diasValidos.includes(value.diaDaSemana));
  }

  horaInicialIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return diasDeFuncionamento.every(
      value => value && typeof value.horaInicial === 'string' && timeRegex.test(value.horaInicial)
    );
  }

  horaFinalIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    return diasDeFuncionamento.every(value => {
      if (!value || typeof value.horaInicial !== 'string' || typeof value.horaFinal !== 'string')
        return false;
      if (!timeRegex.test(value.horaInicial) || !timeRegex.test(value.horaFinal)) return false;
      // garante que horaFinal > horaInicial
      return toMinutes(value.horaFinal) > toMinutes(value.horaInicial);
    });
  }

  ativoIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(value => value && typeof value.ativo === 'boolean');
  }

  userIdIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(
      value => value && (typeof value.userId === 'string' || value.userId === null)
    );
  }

  horasIsValid(diasDeFuncionamento) {
    if (!Array.isArray(diasDeFuncionamento)) return false;
    return diasDeFuncionamento.every(
      value => value && value.horaInicial !== value.horaFinal && value.horaInicial < value.horaFinal
    );
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

export const validateUpdateDisponibilidadeProfessor = (req, res, next) => {
  const validateUpdateDisponibilidadeProfessor = new ValidateUpdateDisponibilidadeProfessor(
    req,
    res,
    next
  );
  return validateUpdateDisponibilidadeProfessor.handle();
};
