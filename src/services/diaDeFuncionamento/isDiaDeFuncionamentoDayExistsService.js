import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class IsDiaDeFuncionamentoDayExistsService extends AbstractService {
  constructor(Repository, diaDaSemana) {
    super(Repository);
    this.diaDaSemana = diaDaSemana;
  }

  async execute() {
    const diaDeFuncionamento = await this.repository.selectOne({
      where: { diaDaSemana: this.diaDaSemana },
      select: { id: true }
    });

    return Boolean(diaDeFuncionamento);
  }

  static async handle(diaDaSemana) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new IsDiaDeFuncionamentoDayExistsService(Repository, diaDaSemana);
    return await service.execute();
  }
}
