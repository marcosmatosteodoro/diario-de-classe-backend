import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class UpdateDiaAulaService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      idAluno: this.data.idAluno,
      idContrato: this.data.idContrato,
      diaSemana: this.data.diaSemana,
      quantidadeAulas: this.data.quantidadeAulas,
      duracaoAula: this.data.duracaoAula,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} data campos parciais do dia de aula (undefined vira remocao da chave)
   * @param {string} [data.idAluno]
   * @param {string} [data.idContrato]
   * @param {string} [data.diaSemana] `SEGUNDA`|`TERCA`|`QUARTA`|`QUINTA`|`SEXTA`|`SABADO`|`DOMINGO`
   * @param {number} [data.quantidadeAulas]
   * @param {number} [data.duracaoAula]
   * @param {string} [data.horaInicial] formato `HH:MM`
   * @param {string} [data.horaFinal] formato `HH:MM`
   * @returns {Promise<Object>} dia de aula atualizado, projetado pela whitelist de saida
   */
  static async handle(id, data) {
    const Repository = DiaAulaRepository;
    const service = new UpdateDiaAulaService(Repository, id, data);
    return await service.execute();
  }
}
