import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com Livro
 * Centraliza todas as operações de banco de dados relacionadas aos Livro
 */
export default class LivroRepository extends AbstractRepository {
  getEntity() {
    return prisma.livro;
  }

  getSelectFields() {
    return {
      id: true,
      nome: true,
      idioma: true,
      nivel: true,
      ativo: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }

  /**
   * Campos do livro mais seus `conteudos` (id, ordem, titulo, descricao),
   * ordenados por `ordem` asc.
   * @returns {Object}
   */
  getSelectFieldsWithConteudos() {
    return {
      ...this.getSelectFields(),
      conteudos: {
        select: {
          id: true,
          ordem: true,
          titulo: true,
          descricao: true
        },
        orderBy: { ordem: 'asc' }
      }
    };
  }
}
