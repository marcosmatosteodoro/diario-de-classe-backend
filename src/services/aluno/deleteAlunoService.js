import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class DeleteAlunoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * Hard delete direto, sem `select` (retorna o registro completo do model) e
   * sem checagem previa de dependentes: contrato, diaAula, aula e cronograma
   * do aluno tem `onDelete: Cascade` e somem junto, sem soft delete.
   * @param {string} id
   * @returns {Promise<Object>} aluno removido
   */
  static async handle(id) {
    const Repository = AlunoRepository;
    const service = new DeleteAlunoService(Repository, id);
    return await service.execute();
  }
}
