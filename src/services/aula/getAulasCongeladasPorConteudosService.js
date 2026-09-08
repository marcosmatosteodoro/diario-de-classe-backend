import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';
import { STATUS_CONGELA_CONTEUDO } from '../../utilities/cronogramaRules.js';

/**
 * Aulas com vinculo congelado (concluidas ou de escolha manual) que apontam
 * para algum dos conteudos informados.
 *
 * Usado para barrar a remocao de conteudo que ja tem historico: apagar a linha
 * zeraria o vinculo da aula concluida via ON DELETE SET NULL, e o registro do
 * que foi dado se perderia sem volta.
 */
export class GetAulasCongeladasPorConteudosService extends AbstractService {
  constructor(Repository, idsConteudo) {
    super(Repository);
    this.idsConteudo = idsConteudo;
  }

  async execute() {
    if (!this.idsConteudo || this.idsConteudo.length === 0) {
      return [];
    }

    return await this.repository.selectMany({
      where: {
        idConteudo: { in: this.idsConteudo },
        OR: [{ status: { in: STATUS_CONGELA_CONTEUDO } }, { conteudoManual: true }]
      },
      select: { id: true, idConteudo: true, idContrato: true, status: true }
    });
  }

  static async handle(idsConteudo) {
    const Repository = AulaRepository;
    const service = new GetAulasCongeladasPorConteudosService(Repository, idsConteudo);
    return await service.execute();
  }
}
