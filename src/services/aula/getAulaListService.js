import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class GetAulaListService extends AbstractService {
  // TODO entender a necessidade de retornar todos os dados de aulas em todas as situações, algumas chamadas devem retornar só a aula, outra só a aula com os nomes e outras completas
  constructor(Repository, where, params) {
    super(Repository);
    this.where = where;

    if (params && params.withRelations) {
      this.select = this.repository.getSelectFieldsWithRelations();
    } else if (params && params.select) {
      this.select = params.select;
    } else {
      this.select = this.repository.getSelectFieldsWithRelations();
      // this.select = this.repository.selectFields;
    }
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.select,
      where: this.where,
      orderBy: { dataAula: 'asc' }
    });
  }

  static async handle(where = {}, params = {}) {
    const Repository = AulaRepository;
    const service = new GetAulaListService(Repository, where, params);
    return await service.execute();
  }
}
