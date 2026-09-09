import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class GetAulaService extends AbstractService {
  constructor(Repository, id, additionalWhere = {}) {
    super(Repository);
    this.id = id;
    this.where = {
      id: this.id,
      ...additionalWhere
    };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.getSelectFieldsWithRelations()
    });
  }

  /**
   * O `additionalWhere` carrega o filtro de autorizacao dos controllers de aula
   * (AbstractAulaController monta `{ idProfessor }` para professor nao-admin).
   * Antes ele era aceito na chamada e descartado aqui, entao os cinco
   * controllers que ja o enviavam liberavam aula de qualquer professor.
   */
  static async handle(id, additionalWhere = {}) {
    const Repository = AulaRepository;
    const service = new GetAulaService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
