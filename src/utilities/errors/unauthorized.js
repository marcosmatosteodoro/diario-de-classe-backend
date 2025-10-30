import ExtendableError from './extendable-error.js';

export default class UnauthorizedError extends ExtendableError {
  constructor() {
    super('UnauthorizedError');
  }
}
