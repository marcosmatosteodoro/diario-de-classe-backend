import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

/**
 * Cronogramas que usam um livro. Serve para barrar a exclusao de livro em uso e
 * para saber quais contratos precisam ser resequenciados quando o conteudo do
 * livro muda.
 */
export class GetCronogramaListByLivroService extends AbstractService {
  constructor(Repository, idLivro, { apenasAtivos = false } = {}) {
    super(Repository);
    this.where = { idLivro };

    if (apenasAtivos) {
      this.where.ativo = true;
    }
  }

  async execute() {
    return await this.repository.selectMany({
      where: this.where,
      select: { id: true, idContrato: true, ativo: true }
    });
  }

  /**
   * @param {string} idLivro
   * @param {Object} [options]
   * @param {boolean} [options.apenasAtivos] restringe a cronogramas com `ativo: true`
   * @returns {Promise<Array<{ id: string, idContrato: string, ativo: boolean }>>}
   */
  static async handle(idLivro, options = {}) {
    const Repository = CronogramaAlunoRepository;
    const service = new GetCronogramaListByLivroService(Repository, idLivro, options);
    return await service.execute();
  }
}
