import ExtendableError from './extendableError.js';

export default class UnauthorizedError extends ExtendableError {
  constructor() {
    super('UnauthorizedError');
  }
}
