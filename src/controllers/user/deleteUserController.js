import AbstractController from '../abstractController.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { DeleteUserService } from '../../services/user/deleteUserService.js';

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
