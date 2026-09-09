import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com ConteudoLivro
 * Centraliza todas as operações de banco de dados relacionadas aos ConteudoLivro
 */
export default class ConteudoLivroRepository extends AbstractRepository {
  getEntity() {
    return prisma.conteudoLivro;
  }

  getSelectFields() {
    return {
      id: true,
      idLivro: true,
      ordem: true,
      titulo: true,
      descricao: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }

  /**
   * Cria varios conteudos de uma vez, usado na importacao de planilha.
   * @param {Array<Object>} data
   * @returns {Promise<{ count: number }>}
   */
  async createMany(data) {
    return await this.entity.createMany({ data, skipDuplicates: true });
  }

  /**
   * Remove todos os conteudos de um livro. Usado quando a planilha substitui
   * o conteudo do livro inteiro.
   * @param {string} idLivro
   * @returns {Promise<{ count: number }>}
   */
  async deleteManyByLivro(idLivro) {
    return await this.entity.deleteMany({ where: { idLivro } });
  }

  /**
   * Troca o conteudo de um livro em uma transacao unica, preservando as linhas
   * por posicao (`ordem`) em vez de apagar e recriar tudo.
   *
   * A versao anterior fazia deleteMany + createMany. Como a FK de Aula e
   * ON DELETE SET NULL, toda aula perdia o vinculo -- incluindo as CONCLUIDA,
   * cujo vinculo o resequenciador preserva "como esta gravado, inclusive nulo".
   * O historico do que foi dado se perdia de forma irreversivel e a sequencia
   * reiniciava do primeiro conteudo, mandando o aluno repetir materia.
   *
   * Fazendo update na linha que ja ocupa aquela ordem, a FK nunca e zerada e o
   * vinculo das aulas concluidas sobrevive a reimportacao.
   *
   * @param {string} idLivro
   * @param {Array<Object>} data conteudos ja normalizados, com `ordem` 1..N
   * @returns {Promise<{ count: number, criados: number, atualizados: number, removidos: number }>}
   */
  async substituirByLivro(idLivro, data) {
    const existentes = await this.entity.findMany({
      where: { idLivro },
      select: { id: true, ordem: true }
    });

    const idPorOrdem = new Map(existentes.map(conteudo => [conteudo.ordem, conteudo.id]));
    const ordensNovas = new Set(data.map(item => item.ordem));
    const idsRemovidos = existentes
      .filter(conteudo => !ordensNovas.has(conteudo.ordem))
      .map(conteudo => conteudo.id);

    const operacoes = [];
    let criados = 0;
    let atualizados = 0;

    for (const item of data) {
      const idExistente = idPorOrdem.get(item.ordem);

      if (idExistente) {
        atualizados += 1;
        operacoes.push(
          this.entity.update({
            where: { id: idExistente },
            data: { titulo: item.titulo, descricao: item.descricao },
            select: { id: true }
          })
        );
        continue;
      }

      criados += 1;
      operacoes.push(this.entity.create({ data: item, select: { id: true } }));
    }

    if (idsRemovidos.length > 0) {
      operacoes.push(this.entity.deleteMany({ where: { id: { in: idsRemovidos } } }));
    }

    await prisma.$transaction(operacoes);

    return { count: data.length, criados, atualizados, removidos: idsRemovidos.length };
  }

  /**
   * Ids dos conteudos que ocupam ordem acima de `limite` no livro. Sao os que
   * uma planilha menor removeria.
   * @param {string} idLivro
   * @param {number} limite
   * @returns {Promise<Array<{ id: string, ordem: number, titulo: string }>>}
   */
  async selectAcimaDaOrdem(idLivro, limite) {
    return await this.entity.findMany({
      where: { idLivro, ordem: { gt: limite } },
      select: { id: true, ordem: true, titulo: true },
      orderBy: { ordem: 'asc' }
    });
  }

  /**
   * Maior `ordem` ja usada no livro, para encadear novos conteudos no fim.
   * @param {string} idLivro
   * @returns {Promise<number>} 0 quando o livro ainda nao tem conteudo
   */
  async maxOrdemByLivro(idLivro) {
    const resultado = await this.entity.aggregate({
      where: { idLivro },
      _max: { ordem: true }
    });

    return resultado?._max?.ordem || 0;
  }
}
