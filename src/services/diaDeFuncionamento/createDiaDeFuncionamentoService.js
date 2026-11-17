import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

/**
 * Cria um registro de DiaDeFuncionamento vinculado a uma Configuracao.
 *
 * O registro não restringe nada fora de si mesmo: nenhuma validação de aula,
 * dia de aula ou disponibilidade confere contra o horário aqui armazenado.
 */
export class CreateDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        diaSemana: this.data.diaSemana,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal,
        ativo: this.data.ativo,
        configuracaoId: this.data.configuracaoId
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  /**
   * @param {Object} data
   * @param {string} data.diaSemana - enum DiaDaSemana (ex.: 'SEGUNDA')
   * @param {string} data.horaInicial - horário de abertura (string, ex.: '08:00')
   * @param {string} data.horaFinal - horário de fechamento (string, ex.: '18:00')
   * @param {boolean} [data.ativo]
   * @param {string} data.configuracaoId - id da Configuracao a que este dia pertence
   * @returns {Promise<Object>} registro criado, com os campos de
   *   DiaDeFuncionamentoRepository.getSelectFields()
   */
  static async handle(data) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new CreateDiaDeFuncionamentoService(Repository, data);
    return await service.execute();
  }
}
