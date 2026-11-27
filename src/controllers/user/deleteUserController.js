import AbstractController from '../abstractController.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { DeleteUserService } from '../../services/user/deleteUserService.js';
import { AvaliarContaFixaDemoService } from '../../services/user/avaliarContaFixaDemoService.js';
import { registrarRecusaDemo } from '../../utilities/registrarRecusaDemo.js';

export class DeleteUserController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const user = await GetUserService.handle(id);

      if (!user) {
        return this.res.status(404).json({
          message: this.req.t('users.get.not_found')
        });
      }

      // Conta fixa nunca é excluída no modo demonstração; avaliar antes do service garante que nada é aplicado (DEC-002-004 · demonstracao).
      if (
        AvaliarContaFixaDemoService.handle({ acao: 'excluir', contaAtual: user, body: {} }).recusar
      ) {
        registrarRecusaDemo(this.req, { acao: 'excluir_conta_fixa', contaAlvoId: id });
        return this.res.status(403).json({
          message: this.req.t('api.errors.demo_mode_blocked')
        });
      }

      await DeleteUserService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'users.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteUserController(req, res);
    await controller.execute();
  }
}
