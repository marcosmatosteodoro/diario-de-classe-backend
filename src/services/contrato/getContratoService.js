import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class GetContratoService extends AbstractService {
  constructor(Repository, id, params = {}) {
    super(Repository);
    this.id = id;
    this.select =
      params && params.withRelations
        ? this.repository.getSelectFieldsWithRelations()
        : this.repository.selectFields;
    this.where = {
      id: this.id,
      ...(params.additionalWhere || {})
    };
  }

  async execute() {
    const contrato = await this.repository.selectOne({
      where: this.where,
      select: this.select,
      order: {
        aulas: {
          dataAula: 'asc',
          horaInicial: 'asc'
        }
      }
    });

    // Ordenar aulas manualmente em JavaScript
    if (contrato && contrato.aulas && Array.isArray(contrato.aulas)) {
      contrato.aulas.sort((a, b) => {
        // Primeiro ordena por dataAula
        const dateA = new Date(a.dataAula);
        const dateB = new Date(b.dataAula);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }

        // Se as datas forem iguais, ordena por horaInicial
        const [horaA, minutoA] = a.horaInicial.split(':').map(Number);
        const [horaB, minutoB] = b.horaInicial.split(':').map(Number);

        const minutosA = horaA * 60 + minutoA;
        const minutosB = horaB * 60 + minutoB;

        return minutosA - minutosB;
      });
    }

    return contrato;
  }

  static async handle(id, params) {
    const Repository = ContratoRepository;
    const service = new GetContratoService(Repository, id, params);
    return await service.execute();
  }
}
