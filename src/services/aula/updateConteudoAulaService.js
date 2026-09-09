import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

/**
 * Grava o conteudo escolhido a mao pelo professor em uma aula.
 *
 * Service proprio, e nao o UpdateAulaService generico, porque aqui apenas
 * `idConteudo` e `conteudoManual` podem mudar: o vinculo precisa passar pela
 * checagem de que o conteudo pertence ao livro em curso daquele aluno, feita no
 * controller, e nenhum outro campo da aula deve viajar junto.
 *
 * `conteudoManual` marca a aula para o ResequenciarCronogramaService nao
 * sobrescrever a escolha no proximo disparo. Enviar `idConteudo` nulo devolve a
 * aula ao controle automatico.
 */
export class UpdateConteudoAulaService extends AbstractService {
  constructor(Repository, id, idConteudo) {
    super(Repository);
    this.id = id;
    this.idConteudo = idConteudo || null;
  }

  async execute() {
    return await this.repository.update(
      { id: this.id },
      {
        idConteudo: this.idConteudo,
        conteudoManual: this.idConteudo !== null
      },
      {
        select: this.repository.getSelectFieldsWithConteudo()
      }
    );
  }

  static async handle(id, idConteudo) {
    const Repository = AulaRepository;
    const service = new UpdateConteudoAulaService(Repository, id, idConteudo);
    return await service.execute();
  }
}
