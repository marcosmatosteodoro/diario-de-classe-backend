import Constants from '../utilities/constants.js';

/**
 * Classe abstrata para controllers
 * Define a estrutura básica que todos os controllers devem seguir
 */
export default class AbstractController {
  constructor(req, res) {
    if (new.target === AbstractController) {
      throw new Error('AbstractController não pode ser instanciada diretamente');
    }

    if (!req || !res) {
      throw new Error('Parâmetros req e res são obrigatórios');
    }

    this.req = req;
    this.res = res;
    this.where = {};
  }

  /**
   * Método abstrato que deve ser implementado pelas subclasses
   * Contém a lógica principal do controller
   * @returns {Promise<any>} Resposta HTTP
   */
  async execute() {
    throw new Error('Método execute() deve ser implementado na subclasse');
  }

  /**
   * Método estático para executar o controller de forma conveniente
   * @param {Object} _req - Objeto de requisição Express
   * @param {Object} _res - Objeto de resposta Express
   * @returns {Promise<void>}
   */
  static async handle(_req, _res) {
    throw new Error('Método handle() deve ser implementado na subclasse');
  }

  /**
   * Método padronizado para tratamento de erros
   * @param {Error} error - Erro a ser tratado
   * @param {string} messageKey - Chave de tradução da mensagem
   * @param {number} statusCode - Código de status HTTP (padrão: 500)
   * @returns {Response} Resposta HTTP com erro
   */
  handleError(error, messageKey = 'error.internal', statusCode = 500) {
    console.error(`[${this.constructor.name}] Erro:`, error);

    const errorResponse = {
      message: this.req.t ? this.req.t(messageKey) : 'Erro interno do servidor',
      error: error.message
    };

    // Em ambiente de desenvolvimento, inclui stack trace
    if (Constants.env === 'development') {
      errorResponse.stack = error.stack;
    }

    return this.res.status(statusCode).json(errorResponse);
  }

  getWhereClauseByQuerySearch({ query, fields }) {
    this.where.OR = fields.map(field => ({ [field]: { contains: query } }));
  }
}
