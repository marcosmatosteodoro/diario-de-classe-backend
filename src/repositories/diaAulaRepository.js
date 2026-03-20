import prisma from '../db/prisma.js';
import AbstractRepository from './abstractRepository.js';

/**
 * Repository para operações com DiaAula
 * Centraliza todas as operações de banco de dados relacionadas aos DiaAula
 */
export default class DiaAulaRepository extends AbstractRepository {
  getEntity() {
    return prisma.diaAula;
  }

  getSelectFields() {
    return {
      id: true,
      idAluno: true,
      idContrato: true,
      diaSemana: true,
      quantidadeAulas: true,
      duracaoAula: true,
      horaInicial: true,
      horaFinal: true,
      dataCriacao: true,
      dataAtualizacao: true
    };
  }
}
