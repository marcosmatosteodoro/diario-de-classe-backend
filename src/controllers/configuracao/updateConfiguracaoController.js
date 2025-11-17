import AbstractController from '../abstractController.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';
import { UpdateConfiguracaoService } from '../../services/configuracao/updateConfiguracaoService.js';
import { UpdateDiaDeFuncionamentoService } from '../../services/diaDeFuncionamento/updateDiaDeFuncionamentoService.js';

export class UpdateConfiguracaoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const configuracoes = await GetConfiguracaoService.handle();

      if (!configuracoes || configuracoes.length === 0) {
        return this.res.status(404).json({ message: this.req.t('configuracaos.get.not_found') });
      }

      const configuracaoId = configuracoes[0].id;

      const configuracao = {
        id: configuracaoId,
        duracaoDaAula: this.req.body.duracaoDaAula,
        tolerancia: this.req.body.tolerancia
      };
      const diasDeFuncionamento = this.req.body.diasDeFuncionamento;

      for (const diaDeFuncionamento of diasDeFuncionamento)
        await UpdateDiaDeFuncionamentoService.handle(diaDeFuncionamento.id, diaDeFuncionamento);

      const updatedConfiguracao = await UpdateConfiguracaoService.handle(
        configuracaoId,
        configuracao
      );

      return this.res.status(200).json(updatedConfiguracao);
    } catch (error) {
      return this.handleError(error, 'configuracaos.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateConfiguracaoController(req, res);
    await controller.execute();
  }
}
