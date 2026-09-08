import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';
import { GetAulaListService } from '../aula/getAulaListService.js';
import { ResequenciarCronogramaService } from '../cronograma/resequenciarCronogramaService.js';

/**
 * Recalcula o estado derivado do contrato depois de qualquer mudanca nas aulas:
 * os totais e o cronograma de conteudo.
 *
 * Ja era o ponto por onde passam todas as mutacoes de aula (criar, atualizar,
 * excluir, andamento, e a geracao de aulas ao criar/atualizar contrato), entao
 * o resequenciamento entra aqui em vez de ser repetido em cada controller --
 * assim nenhuma mudanca futura de aula esquece de religar o conteudo.
 *
 * Em contrato sem livro em curso o resequenciamento e no-op: nada muda para
 * quem ainda nao usa cronograma.
 */
export class UpdateAulasContratoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    const id = this.id;
    const where = { id };
    const aulas = await GetAulaListService.handle({
      idContrato: id
    });

    const data = {
      totalAulas: aulas.length,
      // totalAulasAFazer: aulas.filter(
      //   aula => aula.status === 'AGENDADA' || aula.status === 'EM_ANDAMENTO'
      // ).length,
      totalAulasFeitas: aulas.filter(aula => aula.status === 'CONCLUIDA').length,
      totalReposicoes: aulas.filter(aula => aula.tipo === 'REPOSICAO').length,
      totalFaltas: aulas.filter(aula => aula.status === 'CANCELADA_POR_FALTA').length,
      totalAulasCanceladas: aulas.filter(aula => aula.status === 'CANCELADA').length
    };
    const contrato = await this.repository.update(where, data, {
      select: this.repository.selectFields
    });

    // Cancelar aula, marcar falta ou concluir muda quais aulas consomem
    // conteudo, e por isso a sequencia do livro precisa escorregar.
    await ResequenciarCronogramaService.handle(id);

    return contrato;
  }

  static async handle(id) {
    const Repository = ContratoRepository;
    const service = new UpdateAulasContratoService(Repository, id);
    return await service.execute();
  }
}
