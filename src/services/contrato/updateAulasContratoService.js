import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';
import { GetAulaListService } from '../aula/getAulaListService.js';

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
    return await this.repository.update(where, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id) {
    const Repository = ContratoRepository;
    const service = new UpdateAulasContratoService(Repository, id);
    return await service.execute();
  }
}
