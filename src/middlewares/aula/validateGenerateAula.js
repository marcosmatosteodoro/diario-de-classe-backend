import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { BaseValidateEntity } from '../../utilities/baseValidateEntity.js';
import { ValidateData } from '../../utilities/validateData.js';
import { startOfTodayUTC } from '../../utilities/startOfTodayUTC.js';

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

  validateConfirmation() {
    const { confirm } = this.req.body;
    const confirms = ['keep', 'overwrite', 'generateNew'];
    return confirm && confirms.includes(confirm);
  }
  validateAulasOutroProfessor(contrato) {
    const aulasOutroProfessor = contrato.aulas.filter(
      aula => aula.idProfessor !== this.req.body.idProfessor
    );
    this.aulasOutroProfessorCount = aulasOutroProfessor.length;
    this.idOutosProfessores = [...new Set(aulasOutroProfessor.map(aula => aula.idProfessor))];
    return aulasOutroProfessor.length > 0 && !this.validateConfirmation();
  }

  validateAulasSalvas(contrato) {
    // Aulas "salvas" = as que já ocorreram (estritamente antes de hoje).
    // Comparação por dia em UTC, consistente com as datas armazenadas.
    const hoje = startOfTodayUTC();
    this.aulasSalvas = contrato.aulas.filter(aula => new Date(aula.dataAula) < hoje);
    return this.aulasSalvas.length > 0 && !this.validateConfirmation();
  }

  async handle() {
    try {
      if (!this.req.body) {
        return this.res.status(400).json({
          message: this.req.t ? this.req.t('validation.noData') : 'Dados não fornecidos'
        });
      }

      if (this.isArray) {
        return this.handleArrayValidation();
      }

      if (this.req.body.isEdit) {
        if (!this.req.body.id) {
          return this.res.status(400).json({
            message: this.req.t ? this.req.t('validation.noId') : 'ID não fornecido para edição'
          });
        }

        const contrato = await GetContratoService.handle(this.req.body.id, { withRelations: true });

        if (!contrato) {
          return this.res.status(404).json({
            message: this.req.t ? this.req.t('validation.noData') : 'Dados não encontrados'
          });
        }

        if (this.validateAulasOutroProfessor(contrato) || this.validateAulasSalvas(contrato)) {
          return this.res.status(409).json({
            message: this.req.t('validation.contrato.hasAulasWithOtherProfessor', {
              count: this.aulasOutroProfessorCount
            }),
            idOutosProfessores: this.idOutosProfessores,
            options: [
              {
                value: 'overwrite',
                label: this.req.t('validation.contrato.option.overwrite')
              },
              {
                value: 'generateNew',
                label: this.req.t('validation.contrato.option.generateNew')
              }
            ]
          });
        }
      }

      return this.handleSingleValidation();
    } catch (error) {
      return this.res.status(500).json({
        message: this.req.t ? this.req.t('error.internal') : 'Erro interno do servidor',
        error: error.message
      });
    }
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
