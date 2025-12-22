import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com alunos
 * Centraliza todas as operações de banco de dados relacionadas aos alunos
 */
export default class AlunoRepository extends AbstractRepository {
  getEntity() {
    return prisma.aluno;
  }

  getSelectFields() {
    return {
      id: true,
      nome: true,
      sobrenome: true,
      email: true,
      telefone: true,
      criador: true,
      material: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }
}
