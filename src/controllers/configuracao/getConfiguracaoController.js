import AbstractController from '../abstractController.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';

export class GetConfiguracaoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const configuracoes = await GetConfiguracaoService.handle();

      if (!configuracoes || configuracoes.length === 0) {
        return this.res.status(204).json();
      }

      const configuracao = configuracoes[0];

      return this.res.status(200).json(configuracao);
    } catch (error) {
      return this.handleError(error, 'configuracaos.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetConfiguracaoController(req, res);
    await controller.execute();
  }
}
