import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

/**
 * Busca configurações e ordena os `diasDeFuncionamento` de cada uma pela
 * ordem natural da semana (SEGUNDA..DOMINGO), já que o Prisma não garante
 * ordem no campo relacional.
 */
export class GetConfiguracaoService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    const diasOrdem = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    const result = await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where
    });
    // Ordena diasDeFuncionamento em cada configuração pelo campo diaSemana
    return result.map(config => {
      if (Array.isArray(config.diasDeFuncionamento)) {
        config.diasDeFuncionamento = [...config.diasDeFuncionamento].sort(
          (a, b) => diasOrdem.indexOf(a.diaSemana) - diasOrdem.indexOf(b.diaSemana)
        );
      }
      return config;
    });
  }

  /**
   * @param {Object} [where] - condições de filtro (Prisma `where`); vazio traz todas
   * @returns {Promise<Array<Object>>} configurações com os campos de
   *   ConfiguracaoRepository.getSelectFields(), cada uma com
   *   `diasDeFuncionamento` ordenado por dia da semana
   */
  static async handle(where = {}) {
    const Repository = ConfiguracaoRepository;
    const service = new GetConfiguracaoService(Repository, where);
    return await service.execute();
  }
}
