import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com aulas
 * Centraliza todas as operações de banco de dados relacionadas aos aulas
 */
export default class AulaRepository extends AbstractRepository {
  getEntity() {
    return prisma.aula;
  }

  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      idProfessor: true,
      idContrato: true,
      dataAula: true,
      horaInicial: true,
      horaFinal: true,
      duracaoAula: true,
      tipo: true,
      status: true,
      observacao: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }

  getSelectFieldsWithRelations() {
    return {
      id: true,
      idAluno: true,
      idProfessor: true,
      idContrato: true,
      dataAula: true,
      horaInicial: true,
      horaFinal: true,
      duracaoAula: true,
      tipo: true,
      status: true,
      observacao: true,
      aluno: true,
      professor: true,
      contrato: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }

  /**
   * Campos usados pelo cronograma: alem da aula, o conteudo vinculado.
   * @returns {Object}
   */
  getSelectFieldsWithConteudo() {
    return {
      ...this.getSelectFields(),
      idConteudo: true,
      conteudoManual: true,
      conteudo: {
        select: {
          id: true,
          idLivro: true,
          ordem: true,
          titulo: true,
          descricao: true,
          // O livro vem do proprio conteudo da aula, e nao do cronograma em
          // curso: as aulas concluidas de um livro anterior seriam rotuladas
          // com o nome do livro atual na planilha.
          livro: {
            select: { id: true, nome: true }
          }
        }
      }
    };
  }

  /**
   * Campos minimos para resequenciar o cronograma de um contrato.
   * @returns {Object}
   */
  getSelectFieldsForResequenciamento() {
    return {
      id: true,
      dataAula: true,
      horaInicial: true,
      tipo: true,
      status: true,
      idConteudo: true,
      conteudoManual: true
    };
  }

  /**
   * Aplica em lote os novos vinculos aula -> conteudo, em uma transacao unica.
   * Ou todos os vinculos do contrato mudam, ou nenhum: um resequenciamento
   * parcial deixaria o cronograma com conteudo repetido ou furo na sequencia.
   *
   * @param {Array<{ id: string, idConteudo: string|null }>} vinculos
   * @returns {Promise<number>} quantidade de aulas atualizadas
   */
  async updateConteudoEmLote(vinculos) {
    if (!vinculos || vinculos.length === 0) {
      return 0;
    }

    const operacoes = vinculos.map(({ id, idConteudo }) =>
      this.entity.update({
        where: { id },
        data: { idConteudo },
        select: { id: true }
      })
    );

    const resultado = await prisma.$transaction(operacoes);
    return resultado.length;
  }
}
