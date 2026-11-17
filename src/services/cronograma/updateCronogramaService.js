import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

export class UpdateCronogramaService extends AbstractService {
  constructor(Repository, id, data, idContrato) {
    super(Repository);
    this.id = id;
    this.data = data;
    this.idContrato = idContrato;
  }

  async execute() {
    const data = {
      dataInicio: this.data.dataInicio ? new Date(this.data.dataInicio) : undefined,
      dataConclusao: this.data.dataConclusao ? new Date(this.data.dataConclusao) : undefined,
      ativo: this.data.ativo
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const select = this.repository.getSelectFieldsWithLivro();

    // Reativar um cronograma tem que encerrar o livro que estava em curso: o
    // contrato segue um livro por vez.
    if (data.ativo === true && this.idContrato) {
      return await this.repository.updateComoAtivoUnico(this.id, this.idContrato, data, select);
    }

    return await this.repository.update({ id: this.id }, data, { select });
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @param {string|Date} [data.dataInicio]
   * @param {string|Date} [data.dataConclusao]
   * @param {boolean} [data.ativo]
   * @param {string|null} [idContrato] obrigatorio quando `data.ativo === true`: garante
   *   que este vira o unico cronograma ativo do contrato (encerra o anterior na mesma transacao)
   * @returns {Promise<Object>} cronograma atualizado, com livro projetado
   */
  static async handle(id, data, idContrato = null) {
    const Repository = CronogramaAlunoRepository;
    const service = new UpdateCronogramaService(Repository, id, data, idContrato);
    return await service.execute();
  }
}
