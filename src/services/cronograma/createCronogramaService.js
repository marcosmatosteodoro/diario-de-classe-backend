import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

/**
 * Matricula o aluno em um livro. O aluno cursa um livro por vez no contrato,
 * entao o livro anterior e encerrado na mesma transacao (ver
 * CronogramaAlunoRepository.criarComoAtivo).
 */
export class CreateCronogramaService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.criarComoAtivo(
      {
        idAluno: this.data.idAluno,
        idContrato: this.data.idContrato,
        idLivro: this.data.idLivro,
        dataInicio: this.data.dataInicio ? new Date(this.data.dataInicio) : new Date(),
        ativo: true
      },
      this.repository.getSelectFieldsWithLivro()
    );
  }

  /**
   * @param {Object} data
   * @param {string} data.idAluno
   * @param {string} data.idContrato
   * @param {string} data.idLivro
   * @param {string|Date} [data.dataInicio] default `new Date()`
   * @returns {Promise<Object>} cronograma criado (unico ativo do contrato), com o livro projetado
   */
  static async handle(data) {
    const Repository = CronogramaAlunoRepository;
    const service = new CreateCronogramaService(Repository, data);
    return await service.execute();
  }
}
