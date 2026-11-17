import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class CreateDiaAulaService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        idAluno: this.data.idAluno,
        idContrato: this.data.idContrato,
        diaSemana: this.data.diaSemana,
        quantidadeAulas: this.data.quantidadeAulas,
        duracaoAula: this.data.duracaoAula,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  /**
   * @param {Object} data dados do dia de aula
   * @param {string} data.idAluno
   * @param {string} data.idContrato
   * @param {string} data.diaSemana `SEGUNDA`|`TERCA`|`QUARTA`|`QUINTA`|`SEXTA`|`SABADO`|`DOMINGO`
   * @param {number} data.quantidadeAulas
   * @param {number} [data.duracaoAula]
   * @param {string} data.horaInicial formato `HH:MM`
   * @param {string} data.horaFinal formato `HH:MM`
   * @returns {Promise<Object>} dia de aula criado, projetado pela whitelist de saida
   */
  static async handle(data) {
    const Repository = DiaAulaRepository;
    const service = new CreateDiaAulaService(Repository, data);
    return await service.execute();
  }
}
