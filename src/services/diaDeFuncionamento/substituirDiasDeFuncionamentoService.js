import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

/**
 * Substitui dias de funcionamento por uma nova lista de forma atômica:
 * remoção e criações acontecem na mesma transação do repository.
 */
export class SubstituirDiasDeFuncionamentoService extends AbstractService {
  constructor(Repository, idsParaRemover, dias) {
    super(Repository);
    this.idsParaRemover = idsParaRemover;
    this.dias = dias;
  }

  async execute() {
    const listaData = this.dias.map(dia => ({
      diaSemana: dia.diaSemana,
      horaInicial: dia.horaInicial,
      horaFinal: dia.horaFinal,
      ativo: dia.ativo,
      configuracaoId: dia.configuracaoId
    }));

    return await this.repository.substituir(this.idsParaRemover, listaData, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string[]} idsParaRemover - ids dos dias a remover
   * @param {Object[]} dias - dias a criar
   * @param {string} dias[].diaSemana - enum DiaDaSemana (ex.: 'SEGUNDA')
   * @param {string} dias[].horaInicial - horário de abertura (ex.: '08:00')
   * @param {string} dias[].horaFinal - horário de fechamento (ex.: '18:00')
   * @param {boolean} [dias[].ativo]
   * @param {string} dias[].configuracaoId - id da Configuracao a que o dia pertence
   * @returns {Promise<Object[]>} dias criados, com os campos de
   *   DiaDeFuncionamentoRepository.getSelectFields()
   */
  static async handle(idsParaRemover, dias) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new SubstituirDiasDeFuncionamentoService(Repository, idsParaRemover, dias);
    return await service.execute();
  }
}
