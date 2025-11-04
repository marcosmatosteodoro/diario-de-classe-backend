/**
 * Classe abstrata para serviços
 * Define a estrutura básica que todos os serviços devem seguir
 */
export default class AbstractService {
  constructor(Repository) {
    if (new.target === AbstractService) {
      throw new Error('AbstractService não pode ser instanciada diretamente');
    }

    if (!Repository) {
      throw new Error('Repository é obrigatório');
    }

    this.repository = new Repository();
  }

  /**
   * Método abstrato que deve ser implementado pelas subclasses
   * @returns {Promise<any>} Resultado da execução do serviço
   */
  async execute() {
    throw new Error('Método execute() deve ser implementado na subclasse');
  }

  /**
   * Método estático para executar o serviço de forma conveniente
   * @param {Function} _Repository - Classe do repository a ser utilizado
   * @returns {Promise<any>} Resultado da execução do serviço
   */
  static async handle(_Repository) {
    throw new Error('Método handle() deve ser implementado na subclasse');
  }
}
