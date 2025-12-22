/**
 * Repository abstrato para operações de banco de dados
 * Centraliza todas as operações genéricas de CRUD
 */
export default class AbstractRepository {
  constructor() {
    this.entity = this.getEntity();
    this.selectFields = this.getSelectFields();
  }

  /**
   * Retorna a entidade Prisma para operações
   * @returns {Object} Entidade Prisma correspondente
   */
  getEntity() {
    throw new Error('Método getEntity() deve ser implementado na subclasse');
  }

  /**
   * Retorna os campos padrão para seleção em consultas
   * @returns {Object} Objeto com campos padrão para select
   */
  getSelectFields() {
    throw new Error('Método getSelectFields() deve ser implementado na subclasse');
  }

  /**
   * Busca múltiplos registros com filtros opcionais
   * @param {Object} options - Opções de busca
   * @param {Object} options.where - Condições de filtro
   * @param {Object} options.select - Campos a serem selecionados
   * @param {Object} options.orderBy - Ordenação
   * @param {number} options.skip - Número de registros a pular
   * @param {number} options.take - Número máximo de registros a retornar
   * @returns {Promise<Array>} Lista de registros
   */
  async selectMany(options = {}) {
    const { where, select, orderBy, skip, take } = options;
    return await this.entity.findMany({
      where,
      select,
      orderBy,
      skip,
      take
    });
  }

  /**
   * Busca um único registro por critérios específicos
   * @param {Object} options - Opções de busca
   * @param {Object} options.where - Condições de filtro (obrigatório)
   * @param {Object} options.select - Campos a serem selecionados
   * @returns {Promise<Object|null>} Registro encontrado ou null
   */
  async selectOne(options = {}) {
    const { where, select } = options;

    if (!where) {
      throw new Error('Condições de busca (where) são obrigatórias');
    }

    return await this.entity.findFirst({
      where,
      select
    });
  }

  /**
   * Cria um novo registro
   * @param {Object} data - Dados do registro a ser criado
   * @param {Object} options - Opções adicionais
   * @param {Object} options.select - Campos a serem retornados
   * @returns {Promise<Object>} Registro criado
   */
  async create(data, options = {}) {
    const { select } = options;

    return await this.entity.create({
      data,
      select
    });
  }

  /**
   * Atualiza um registro existente
   * @param {Object} where - Condições para identificar o registro
   * @param {Object} data - Dados a serem atualizados
   * @param {Object} options - Opções adicionais
   * @param {Object} options.select - Campos a serem retornados
   * @returns {Promise<Object>} Registro atualizado
   */
  async update(where, data, options = {}) {
    const { select } = options;

    return await this.entity.update({
      where,
      data,
      select
    });
  }

  /**
   * Remove um registro
   * @param {Object} where - Condições para identificar o registro
   * @param {Object} options - Opções adicionais
   * @param {Object} options.select - Campos a serem retornados
   * @returns {Promise<Object>} Registro removido
   */
  async delete(where, options = {}) {
    const { select } = options;

    return await this.entity.delete({
      where,
      select
    });
  }
}
