import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

/**
 * Verifica se já existe um registro de DiaDeFuncionamento para o dia da
 * semana informado, independente de qual Configuracao ele pertence.
 */
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

  /**
   * @param {string} diaSemana - enum DiaDaSemana (ex.: 'SEGUNDA')
   * @returns {Promise<boolean>} true se já existir um registro para esse dia
   */
  static async handle(diaSemana) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new IsDiaDeFuncionamentoDayExistsService(Repository, diaSemana);
    return await service.execute();
  }
}
