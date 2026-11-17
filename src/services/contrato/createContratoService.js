import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class CreateContratoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        idAluno: this.data.idAluno,
        dataInicio: this.data.dataInicio || null,
        dataTermino: this.data.dataTermino || null,
        status: this.data.status || 'PENDENTE',
        totalAulas: 0,
        totalAulasFeitas: 0,
        totalReposicoes: 0,
        totalFaltas: 0,
        totalAulasCanceladas: 0
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  /**
   * Cria o contrato com os totais derivados zerados — quem preenche `totalAulas`
   * e os demais e `UpdateAulasContratoService`, via recalculo, nunca este create.
   *
   * @param {Object} data
   * @param {string} data.idAluno
   * @param {string|Date} [data.dataInicio]
   * @param {string|Date} [data.dataTermino]
   * @param {string} [data.status] default `'PENDENTE'`
   * @returns {Promise<Object>} contrato criado, projetado pela whitelist padrao
   */
  static async handle(data) {
    const Repository = ContratoRepository;
    const service = new CreateContratoService(Repository, data);
    return await service.execute();
  }
}
