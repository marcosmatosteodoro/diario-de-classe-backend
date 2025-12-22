export default class BaseSeed {
  constructor(params = null) {
    this.createEntityService = this.getCreateEntityService();
    this.mocks = this.generateMocks(params);
    this.models = [];
  }

  generateMocks() {
    throw new Error('generateMocks precisa ser implementado');
  }

  getCreateEntityService() {
    throw new Error('getCreateEntityService precisa ser implementado');
  }

  async execute() {
    const models = this.mocks;

    for (const model of models) {
      const newModel = await this.createEntityService.handle(model);
      this.models.push(newModel);
    }

    return this.models;
  }

  static async handle() {
    throw new Error('handle estático precisa ser implementado');
  }
}
