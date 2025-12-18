import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';

class ValidateCreateManyAula extends BaseValidateEntity {
  constructor(req, res, next) {
    super(req, res, next);
  }

  getDataForFilter() {
    return ['idAluno', 'idProfessor', 'idContrato', 'aulas'];
  }

  getDataValidations(filteredData) {
    const { idAluno, idProfessor, idContrato, aulas } = filteredData;

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
      // Validar campo aulas
      aulas: ValidateData.require()
        .isArray()
        .custom(() => this.validateDate.bind(aulas), 'data inválida')
        .custom(
          () => this.validateHorarios.bind(aulas),
          'Horários devem ser informados corretamente'
        )
        .custom(
          () => this.horaFinalIsAfterHoraInicio.bind(aulas),
          'horaFinal deve ser posterior a horaInicial'
        )
        .custom(() => this.validateTipo.bind(aulas), 'data inválida')
        .custom(() => this.validateObservacao.bind(aulas), 'data inválida')
        .validate(aulas, 'aulas')
    };
  }

  horaFinalIsAfterHoraInicio(aulas) {
    for (const aula of aulas) {
      const { horaInicial, horaFinal } = aula;
      if (!horaInicial || !horaFinal) {
        return true;
      }

      let inicial = horaInicial.replaceAll(':', '');
      let final = horaFinal.replaceAll(':', '');

      inicial = parseInt(inicial) || 0;
      final = parseInt(final) || 0;

      if (final <= inicial) {
        return false;
      }
    }
    return true;
  }

  validateDate(aulas) {
    for (const aula of aulas) {
      const { dataAula } = aula;
      const date = new Date(dataAula);
      if (isNaN(date.getTime())) {
        return false;
      }
    }
    return true;
  }

  validateHorarios(aulas) {
    for (const aula of aulas) {
      const { horaInicial, horaFinal } = aula;
      if (!horaInicial || !horaFinal) {
        return false;
      }
      if (typeof horaInicial !== 'string' || typeof horaFinal !== 'string') {
        return false;
      }
    }
    return true;
  }

  validateTipo(aulas) {
    const validTypes = ['PADRAO', 'REPOSICAO', 'OUTRA'];
    for (const aula of aulas) {
      const { tipo } = aula;
      if (!validTypes.includes(tipo)) {
        return false;
      }
    }
    return true;
  }

  validateObservacao(aulas) {
    for (const aula of aulas) {
      const { observacao } = aula;
      if (observacao) {
        if (typeof observacao !== 'string') {
          return false;
        }
        if (observacao.length < 5 || observacao.length > 1000) {
          return false;
        }
      }
    }
    return true;
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

export const validateCreateManyAula = (req, res, next) => {
  const validateCreateManyAula = new ValidateCreateManyAula(req, res, next);
  return validateCreateManyAula.handle();
};
