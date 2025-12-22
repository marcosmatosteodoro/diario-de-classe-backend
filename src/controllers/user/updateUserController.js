import AbstractController from '../abstractController.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { UpdateUserService } from '../../services/user/updateUserService.js';
import { IsUserEmailExistsService } from '../../services/user/isUserEmailExistsService.js';

export class UpdateUserController extends AbstractController {
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

      if (
        user.email !== this.req.body.email &&
        (await IsUserEmailExistsService.handle(this.req.body.email))
      ) {
        return this.res.status(409).json({
          message: this.req.t('users.create.email_exists')
        });
      }

      const updatedUser = await UpdateUserService.handle(id, this.req.body);

      return this.res.status(200).json(updatedUser);
    } catch (error) {
      return this.handleError(error, 'users.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateUserController(req, res);
    await controller.execute();
  }
}
