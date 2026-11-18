import ExtendableError from './extendableError.js';

export default class ServiceUnavailableError extends ExtendableError {
  constructor() {
    super('ServiceUnavailableError');
  }
}
