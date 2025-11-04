import AbstractController from '../abstractController.js';
import { GetUserListService } from '../../services/user/getUserListService.js';

export class GetUserListController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const users = await GetUserListService.handle();

      if (!users || users.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: users.length,
        data: users
      });
    } catch (error) {
      return this.handleError(error, 'users.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetUserListController(req, res);
    await controller.execute();
  }
}
