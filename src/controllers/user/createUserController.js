import AbstractController from '../abstractController.js';
import { CreateUserService } from '../../services/user/createUserService.js';
import { IsUserEmailExistsService } from '../../services/user/isUserEmailExistsService.js';

export class CreateUserController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (await IsUserEmailExistsService.handle(this.req.body.email)) {
        return this.res.status(409).json({
          message: this.req.t('users.create.email_exists')
        });
      }

      const newUser = await CreateUserService.handle(this.req.body);

      return this.res.status(201).json(newUser);
    } catch (error) {
      return this.handleError(error, 'users.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateUserController(req, res);
    await controller.execute();
  }
}
