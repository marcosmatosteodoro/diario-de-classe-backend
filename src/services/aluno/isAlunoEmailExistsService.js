import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class IsAlunoEmailExistsService extends AbstractService {
  constructor(Repository, email) {
    super(Repository);
    this.email = email;
  }

  async execute() {
    const aluno = await this.repository.selectOne({
      where: { email: this.email },
      select: { id: true }
    });

    return Boolean(aluno);
  }

  /**
   * @param {string} email
   * @returns {Promise<boolean>} true quando ja existe aluno com esse email (barreira de
   *   aplicacao adicional ao `@unique` do schema)
   */
  static async handle(email) {
    const Repository = AlunoRepository;
    const service = new IsAlunoEmailExistsService(Repository, email);
    return await service.execute();
  }
}
