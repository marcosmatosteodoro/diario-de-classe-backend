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
}
