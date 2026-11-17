import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com usuários
 * Centraliza todas as operações de banco de dados relacionadas aos usuários
 */
export default class DiaDeFuncionamentoRepository extends AbstractRepository {
  getEntity() {
    return prisma.diaDeFuncionamento;
  }

  getSelectFields() {
    return {
      id: true,
      diaSemana: true,
      horaInicial: true,
      horaFinal: true,
      ativo: true,
      configuracaoId: true
    };
  }

  /**
   * Remove os dias indicados e cria os novos em uma única transação:
   * se qualquer criação falha, os removidos continuam no banco.
   * @param {string[]} idsParaRemover - ids dos dias a remover
   * @param {Object[]} listaData - dados de cada dia a criar
   * @param {Object} [options]
   * @param {Object} [options.select] - campos retornados (padrão: getSelectFields())
   * @returns {Promise<Object[]>} dias criados, na ordem de listaData
   */
  async substituir(idsParaRemover, listaData, options = {}) {
    const { select = this.selectFields } = options;

    return await prisma.$transaction(async tx => {
      await tx.diaDeFuncionamento.deleteMany({ where: { id: { in: idsParaRemover } } });

      const criados = [];
      for (const data of listaData) {
        criados.push(await tx.diaDeFuncionamento.create({ data, select }));
      }
      return criados;
    });
  }
}
