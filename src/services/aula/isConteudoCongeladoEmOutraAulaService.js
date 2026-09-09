import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';
import { STATUS_CONGELA_CONTEUDO } from '../../utilities/cronogramaRules.js';

/**
 * Verifica se o conteudo ja esta preso a outra aula do mesmo contrato.
 *
 * Vinculo congelado (aula concluida ou escolha manual do professor) nunca e
 * reescrito pelo resequenciador. Se o mesmo conteudo fosse fixado em duas
 * aulas, as duas sobreviveriam e o cronograma passaria a exibir conteudo
 * repetido -- por isso o lancamento manual e recusado nesse caso.
 */
export class IsConteudoCongeladoEmOutraAulaService extends AbstractService {
  constructor(Repository, { idContrato, idConteudo, idAulaIgnorada }) {
    super(Repository);
    this.where = {
      idContrato,
      idConteudo,
      id: { not: idAulaIgnorada },
      OR: [{ status: { in: STATUS_CONGELA_CONTEUDO } }, { conteudoManual: true }]
    };
  }

  async execute() {
    const aula = await this.repository.selectOne({
      where: this.where,
      select: { id: true }
    });

    return Boolean(aula);
  }

  static async handle({ idContrato, idConteudo, idAulaIgnorada }) {
    const Repository = AulaRepository;
    const service = new IsConteudoCongeladoEmOutraAulaService(Repository, {
      idContrato,
      idConteudo,
      idAulaIgnorada
    });
    return await service.execute();
  }
}
