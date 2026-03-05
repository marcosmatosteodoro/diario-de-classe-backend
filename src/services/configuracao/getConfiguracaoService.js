import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

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

  static async handle(where = {}) {
    const Repository = ConfiguracaoRepository;
    const service = new GetConfiguracaoService(Repository, where);
    return await service.execute();
  }
}
