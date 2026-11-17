import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

/**
 * Lista registros de DiaDeFuncionamento por filtro, sem ordenação própria
 * (segue a ordem devolvida pelo Prisma).
 */
export class GetDiaDeFuncionamentoListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where
    });
  }

  /**
   * @param {Object} [where] - condições de filtro (Prisma `where`); vazio traz todos
   * @returns {Promise<Array<Object>>} registros com os campos de
   *   DiaDeFuncionamentoRepository.getSelectFields()
   */
  static async handle(where = {}) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new GetDiaDeFuncionamentoListService(Repository, where);
    return await service.execute();
  }
}
