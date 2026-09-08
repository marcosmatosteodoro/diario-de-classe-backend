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

  static async handle(data) {
    const Repository = CronogramaAlunoRepository;
    const service = new CreateCronogramaService(Repository, data);
    return await service.execute();
  }
}
