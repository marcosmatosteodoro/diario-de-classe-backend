import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com contratos
 * Centraliza todas as operações de banco de dados relacionadas aos contratos
 */
export default class ContratoRepository extends AbstractRepository {
  getEntity() {
    return prisma.contrato;
  }

  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      dataInicio: true,
      dataTermino: true,
      status: true,
      totalAulas: true,
      totalAulasFeitas: true,
      totalReposicoes: true,
      totalFaltas: true,
      totalAulasCanceladas: true,
      dataCriacao: true,
      dataAtualizacao: true,
      aluno: false,
      diaAulas: false
    };
  }

  getSelectFieldsWithRelations() {
    return {
      id: true,
      idAluno: true,
      dataInicio: true,
      dataTermino: true,
      status: true,
      totalAulas: true,
      totalAulasFeitas: true,
      totalReposicoes: true,
      totalFaltas: true,
      totalAulasCanceladas: true,
      dataCriacao: true,
      dataAtualizacao: true,
      aluno: true,
      diaAulas: true,
      aulas: true
    };
  }
}
