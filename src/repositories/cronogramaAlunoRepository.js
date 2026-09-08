import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com CronogramaAluno
 * Centraliza todas as operações de banco de dados relacionadas aos CronogramaAluno
 */
export default class CronogramaAlunoRepository extends AbstractRepository {
  getEntity() {
    return prisma.cronogramaAluno;
  }

  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      idContrato: true,
      idLivro: true,
      dataInicio: true,
      dataConclusao: true,
      ativo: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }

  getSelectFieldsWithLivro() {
    return {
      ...this.getSelectFields(),
      livro: {
        select: {
          id: true,
          nome: true,
          idioma: true,
          nivel: true
        }
      }
    };
  }

  /**
   * Desativa os cronogramas ativos de um contrato. O aluno cursa um livro por
   * vez: ao entrar em um livro novo, o anterior deixa de ser o ativo.
   * @param {string} idContrato
   * @param {Date} dataConclusao
   * @returns {Promise<{ count: number }>}
   */
  async desativarAtivosByContrato(idContrato, dataConclusao = new Date()) {
    return await this.entity.updateMany({
      where: { idContrato, ativo: true },
      data: { ativo: false, dataConclusao }
    });
  }

  /**
   * Encerra o livro em curso e abre o novo em uma transacao unica.
   *
   * Atomico de proposito: se a criacao falhasse depois da desativacao, o
   * contrato ficaria sem nenhum cronograma ativo e o resequenciador passaria a
   * nao encontrar livro; se a desativacao falhasse depois da criacao, o
   * contrato ficaria com dois livros ativos e o `selectOne` do cronograma ativo
   * passaria a devolver um dos dois de forma imprevisivel.
   *
   * @param {Object} data dados do novo cronograma
   * @param {Object} select campos a retornar
   * @returns {Promise<Object>} cronograma criado
   */
  async criarComoAtivo(data, select) {
    const [, criado] = await prisma.$transaction([
      this.entity.updateMany({
        where: { idContrato: data.idContrato, ativo: true },
        data: { ativo: false, dataConclusao: new Date() }
      }),
      this.entity.create({ data, select })
    ]);

    return criado;
  }

  /**
   * Atualiza um cronograma garantindo que ele fique como o unico ativo do
   * contrato, quando a atualizacao o marca como ativo.
   *
   * Sem isso, um PUT com `ativo: true` em um cronograma antigo deixava dois
   * ativos no mesmo contrato e furava a invariante que `criarComoAtivo`
   * protege. O indice parcial no banco tambem barra, mas aqui a operacao passa
   * a ser correta em vez de apenas recusada.
   *
   * @param {string} id
   * @param {string} idContrato
   * @param {Object} data
   * @param {Object} select
   * @returns {Promise<Object>}
   */
  async updateComoAtivoUnico(id, idContrato, data, select) {
    const [, atualizado] = await prisma.$transaction([
      this.entity.updateMany({
        where: { idContrato, ativo: true, id: { not: id } },
        data: { ativo: false, dataConclusao: new Date() }
      }),
      this.entity.update({ where: { id }, data, select })
    ]);

    return atualizado;
  }
}
