import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class GetDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.selectOne({
      where: { id: this.id },
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<Object|null>} registro encontrado, com os campos de
   *   DiaDeFuncionamentoRepository.getSelectFields(), ou `null` se não existir
   */
  static async handle(id) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new GetDiaDeFuncionamentoService(Repository, id);
    return await service.execute();
  }
}
