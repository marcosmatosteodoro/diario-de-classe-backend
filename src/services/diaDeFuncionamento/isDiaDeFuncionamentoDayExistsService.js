import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class IsDiaDeFuncionamentoDayExistsService extends AbstractService {
  constructor(Repository, diaSemana) {
    super(Repository);
    this.diaSemana = diaSemana;
  }

  async execute() {
    const diaDeFuncionamento = await this.repository.selectOne({
      where: { diaSemana: this.diaSemana },
      select: { id: true }
    });

    return Boolean(diaDeFuncionamento);
  }

  static async handle(diaSemana) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new IsDiaDeFuncionamentoDayExistsService(Repository, diaSemana);
    return await service.execute();
  }
}
