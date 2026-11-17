import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

/**
 * Atualiza um registro de DiaDeFuncionamento.
 *
 * O registro não restringe nada fora de si mesmo: nenhuma validação de aula,
 * dia de aula ou disponibilidade confere contra o horário aqui armazenado.
 */
export class UpdateDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      diaSemana: this.data.diaSemana,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal,
      ativo: this.data.ativo,
      configuracaoId: this.data.configuracaoId
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @param {string} [data.diaSemana] - enum DiaDaSemana (ex.: 'SEGUNDA')
   * @param {string} [data.horaInicial] - horário de abertura (string, ex.: '08:00')
   * @param {string} [data.horaFinal] - horário de fechamento (string, ex.: '18:00')
   * @param {boolean} [data.ativo]
   * @param {string} [data.configuracaoId] - id da Configuracao a que este dia pertence
   * @returns {Promise<Object>} registro atualizado, com os campos de
   *   DiaDeFuncionamentoRepository.getSelectFields()
   */
  static async handle(id, data) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new UpdateDiaDeFuncionamentoService(Repository, id, data);
    return await service.execute();
  }
}
